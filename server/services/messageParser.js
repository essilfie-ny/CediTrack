class MessageParser {
  constructor() {
    this.providers = [
      new MTNMoMoProvider(),
      new VodafoneCashProvider(),
      new AirtelTigoProvider(),
      new BankSMSProvider(),
      new GenericProvider()
    ];
  }

  addProvider(provider) {
    this.providers.push(provider);
  }

  parse(message) {
    if (!message || typeof message !== 'string') return null;
    for (const provider of this.providers) {
      const result = provider.parse(message);
      if (result) return { ...result, provider: provider.name };
    }
    return null;
  }
}

class MTNMoMoProvider {
  name = 'MTN MoMo';
  parse(message) {
    if (message.includes('received GHS') && message.includes('from')) {
      const match = message.match(/received GHS ([\d,.]+)/);
      if (match) return { type: 'income', amount: parseFloat(match[1].replace(/,/g, '')) * 100, currency: 'GHS', confidence: 0.9 };
    }
    if (message.includes('sent GHS') || message.includes('paid GHS') || message.includes('Cash out GHS')) {
      const match = message.match(/(sent|paid|Cash out) GHS ([\d,.]+)/);
      if (match) return { type: 'expense', amount: parseFloat(match[2].replace(/,/g, '')) * 100, currency: 'GHS', confidence: 0.9 };
    }
    return null;
  }
}

class VodafoneCashProvider {
  name = 'Vodafone Cash';
  parse(message) {
    if (message.includes('received GHS')) {
      const match = message.match(/received GHS ([\d,.]+)/);
      if (match) return { type: 'income', amount: parseFloat(match[1].replace(/,/g, '')) * 100, currency: 'GHS', confidence: 0.9 };
    }
    if (message.includes('Transfer of GHS')) {
      const match = message.match(/Transfer of GHS ([\d,.]+)/);
      if (match) return { type: 'expense', amount: parseFloat(match[1].replace(/,/g, '')) * 100, currency: 'GHS', confidence: 0.9 };
    }
    return null;
  }
}

class AirtelTigoProvider {
  name = 'AirtelTigo Money';
  parse(message) { return null; }
}

class BankSMSProvider {
  name = 'Bank SMS';
  parse(message) {
    if (message.includes('credited with GHS')) {
      const match = message.match(/credited with GHS ([\d,.]+)/);
      if (match) return { type: 'income', amount: parseFloat(match[1].replace(/,/g, '')) * 100, currency: 'GHS', confidence: 0.8 };
    }
    if (message.includes('debited with GHS')) {
      const match = message.match(/debited with GHS ([\d,.]+)/);
      if (match) return { type: 'expense', amount: parseFloat(match[1].replace(/,/g, '')) * 100, currency: 'GHS', confidence: 0.8 };
    }
    return null;
  }
}

class GenericProvider {
  name = 'Generic Parser';
  parse(message) {
    const match = message.match(/GHS\s?([\d,.]+)/);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, '')) * 100;
      const type = message.toLowerCase().match(/(debit|paid|sent|purchase)/) ? 'expense' : 'income';
      return { type, amount, currency: 'GHS', confidence: 0.4 };
    }
    return null;
  }
}

module.exports = new MessageParser();
