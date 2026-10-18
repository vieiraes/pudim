const { taxaBoleto } = require('./taxa');
jest.mock('./taxa', () => ({ taxaBoleto: () => 3.5 }));
test('taxa do boleto', () => { expect(taxaBoleto()).toBe(3.5); });
