class BluetoothService {
  constructor() {
    this.device = null;
    this.server = null;
    this.service = null;
    this.txCharacteristic = null;
    this.rxCharacteristic = null;
    this.isConnecting = false;
    this.onDisconnected = null;
    this.responseBuffer = '';
    this.responseResolver = null;
    this.responseRejecter = null;
  }

  isSupported() {
    return navigator && navigator.bluetooth && typeof navigator.bluetooth.requestDevice === 'function';
  }

  async connect(onDisconnectCallback) {
    if (!this.isSupported()) {
      throw new Error("Web Bluetooth API is not supported in this browser. Please use Chrome or Edge.");
    }

    if (this.isConnecting) return;
    this.isConnecting = true;
    this.onDisconnected = onDisconnectCallback;

    try {
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '0000fff0-0000-1000-8000-00805f9b34fb',
          '0000ffe0-0000-1000-8000-00805f9b34fb',
          '000018f0-0000-1000-8000-00805f9b34fb'
        ]
      });

      this.device.addEventListener('gattserverdisconnected', this.handleDisconnect.bind(this));

      this.server = await this.device.gatt.connect();

      // Find the correct service
      const services = await this.server.getPrimaryServices();
      if (services.length === 0) {
        throw new Error("No GATT services found on this device.");
      }
      
      // Prioritize known OBD UUIDs, otherwise take the first one (often custom for cheap clones)
      this.service = services.find(s => 
        ['0000fff0', '0000ffe0', '000018f0'].some(uuid => s.uuid.includes(uuid))
      ) || services[0];

      const characteristics = await this.service.getCharacteristics();
      
      // Discover TX and RX characteristics
      for (const char of characteristics) {
        if (char.properties.notify || char.properties.indicate || char.properties.read) {
          this.rxCharacteristic = char;
        }
        if (char.properties.write || char.properties.writeWithoutResponse) {
          this.txCharacteristic = char;
        }
      }

      if (!this.txCharacteristic || !this.rxCharacteristic) {
        // Sometimes it's the same characteristic for both
        if (this.txCharacteristic && (this.txCharacteristic.properties.notify || this.txCharacteristic.properties.indicate)) {
          this.rxCharacteristic = this.txCharacteristic;
        } else if (this.rxCharacteristic && (this.rxCharacteristic.properties.write || this.rxCharacteristic.properties.writeWithoutResponse)) {
          this.txCharacteristic = this.rxCharacteristic;
        } else {
           throw new Error("Could not find writable and readable characteristics on the device.");
        }
      }

      await this.rxCharacteristic.startNotifications();
      this.rxCharacteristic.addEventListener('characteristicvaluechanged', this.handleCharacteristicValueChanged.bind(this));

      // Initialize ELM327
      await this.initELM327();
      
      this.isConnecting = false;
      return true;
    } catch (error) {
      this.isConnecting = false;
      this.disconnect();
      throw error;
    }
  }

  handleDisconnect() {
    this.device = null;
    this.server = null;
    this.service = null;
    this.txCharacteristic = null;
    this.rxCharacteristic = null;
    if (this.onDisconnected) {
      this.onDisconnected();
    }
  }

  disconnect() {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.handleDisconnect();
  }

  handleCharacteristicValueChanged(event) {
    const value = event.target.value;
    const decoder = new TextDecoder('utf-8');
    const strValue = decoder.decode(value);
    
    this.responseBuffer += strValue;
    
    // Most ELM327 responses end with a > prompt
    if (this.responseBuffer.includes('>')) {
      if (this.responseResolver) {
        const fullResponse = this.responseBuffer.trim().replace('>', '');
        this.responseResolver(fullResponse);
        this.responseResolver = null;
        this.responseRejecter = null;
      }
      this.responseBuffer = ''; // Clear buffer for next command
    }
  }

  async sendCommand(command, timeoutMs = 5000) {
    if (!this.txCharacteristic) {
      throw new Error("Not connected to a writable characteristic.");
    }

    return new Promise(async (resolve, reject) => {
      this.responseResolver = resolve;
      this.responseRejecter = reject;
      this.responseBuffer = '';

      const timeout = setTimeout(() => {
        this.responseResolver = null;
        this.responseRejecter = null;
        this.responseBuffer = '';
        reject(new Error(`Command ${command} timed out.`));
      }, timeoutMs);

      // Wrapper to clear timeout when resolved
      const originalResolve = resolve;
      this.responseResolver = (val) => {
        clearTimeout(timeout);
        originalResolve(val);
      };

      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(command + '\r');
        await this.txCharacteristic.writeValue(data);
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });
  }

  async initELM327() {
    // Basic AT initialization sequence for ELM327
    await this.sendCommand('AT Z'); // Reset
    await new Promise(r => setTimeout(r, 1000)); // Wait for reset
    await this.sendCommand('ATE0'); // Echo off
    await this.sendCommand('ATL0'); // Linefeeds off
    await this.sendCommand('AT SP 0'); // Auto protocol search
    await new Promise(r => setTimeout(r, 500));
  }

  async fetchVIN() {
    try {
      // 09 02 is the OBD-II mode 9 PID 02 for Vehicle Identification Number
      const response = await this.sendCommand('0902');
      
      // Parse the response. A typical successful response looks like:
      // 49 02 01 00 00 00 31 47 31 5A 43 35 45 34 38 46 32 30 31 32 33 34 35
      // 49 = mode 9 response, 02 = PID. The actual VIN is often prefixed or split across multiple lines.
      // We strip non-hex characters and look for the ASCII representation.
      
      const lines = response.split('\r').map(l => l.trim()).filter(l => l);
      let hexData = '';
      
      for (const line of lines) {
         if (line.includes('NO DATA') || line.includes('ERROR')) {
           return null;
         }
         
         // Basic filtering of typical ELM327 multi-line responses
         // Often lines start with "014", "024" etc for multi-frame
         // A simple heuristic is to extract all pairs of hex digits and try to find a 17-char ASCII string.
         
         const parts = line.split(' ');
         for (const part of parts) {
            if (/^[0-9A-F]{2}$/.test(part)) {
                // Ignore the typical headers: 49 02, or multi-frame counters
                hexData += part;
            }
         }
      }
      
      // Convert hex sequence to ASCII
      let asciiString = '';
      for (let i = 0; i < hexData.length; i += 2) {
        const byte = parseInt(hexData.substr(i, 2), 16);
        if (byte >= 32 && byte <= 126) { // Printable ASCII
           asciiString += String.fromCharCode(byte);
        }
      }
      
      // Find the 17-character alphanumeric VIN
      const vinMatch = asciiString.match(/[A-HJ-NPR-Z0-9]{17}/);
      if (vinMatch) {
         return vinMatch[0];
      }
      return null;
    } catch (e) {
      console.error("Error fetching VIN:", e);
      return null;
    }
  }

  async fetchActiveDTCs() {
    try {
      // Fetch confirmed DTCs (Mode 03) and pending DTCs (Mode 07)
      const confirmedResponse = await this.sendCommand('03');
      const pendingResponse = await this.sendCommand('07');
      
      const parseResponse = (response, modeHex) => {
        const lines = response.split('\r').map(l => l.trim()).filter(l => l);
        let parsedCodes = [];
        for (let i = 0; i < lines.length; i++) {
          let line = lines[i];
          if (line.includes('NO DATA') || line.includes('ERROR')) continue;
          
          let cleanHex = line.replace(/\s+/g, '');
          // Mode 03 response starts with 43, Mode 07 response starts with 47
          if (cleanHex.startsWith(modeHex)) {
             cleanHex = cleanHex.substring(2);
             for(let j=0; j < cleanHex.length; j += 4) {
                const dtcHex = cleanHex.substring(j, j+4);
                if (dtcHex.length === 4 && dtcHex !== '0000') {
                   const parsedCode = this.parseDTC(dtcHex);
                   if (parsedCode) parsedCodes.push(parsedCode);
                }
             }
          }
        }
        return parsedCodes;
      };

      const confirmedCodes = parseResponse(confirmedResponse, '43');
      const pendingCodes = parseResponse(pendingResponse, '47');
      
      // Combine and deduplicate
      const allCodes = Array.from(new Set([...confirmedCodes, ...pendingCodes]));
      return allCodes;
    } catch (e) {
      console.error("Error fetching DTCs:", e);
      return [];
    }
  }
  
  parseDTC(hexString) {
      if (hexString.length !== 4) return null;
      
      const firstCharMap = {
          '0': 'P0', '1': 'P1', '2': 'P2', '3': 'P3',
          '4': 'C0', '5': 'C1', '6': 'C2', '7': 'C3',
          '8': 'B0', '9': 'B1', 'A': 'B2', 'B': 'B3',
          'C': 'U0', 'D': 'U1', 'E': 'U2', 'F': 'U3'
      };
      
      const firstHex = hexString.charAt(0).toUpperCase();
      if (!firstCharMap[firstHex]) return null;
      
      return firstCharMap[firstHex] + hexString.substring(1).toUpperCase();
  }
}

export const bluetoothService = new BluetoothService();
