import { loadStdlib, ask } from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';

if (process.argv.length < 3 || !['seller', 'buyer'].includes(process.argv[2])) {
    console.log('Usage: reach run index [seller|buyer]');
    process.exit(0);
}
const role = process.argv[2];
console.log(`Your role is ${role}`);

const stdlib = loadStdlib(process.env);
console.log(`The consensus network is ${stdlib.connector}.`);
const standardUnit = stdlib.standardUnit;
const toAtomicUnit = (_standardUnit) => stdlib.parseCurrency(_standardUnit);
const toStandardUnit = (_atomicUnit) => stdlib.formatCurrency(_atomicUnit, 4);
const initialBalance = toAtomicUnit(1000);
const showBalance = async (_account) => console.log(`Your balance is ${toStandardUnit(await stdlib.balanceOf(_account))} ${standardUnit}.`);

const commonInteract = (role) => ({
    reportTransfer: (payment) => { console.log(`The contract paid ${toStandardUnit(payment)} ${standardUnit} to ${role == 'seller' ? 'you' : 'the seller'}.`) },
    reportPayment: (payment) => { console.log(`${role == 'buyer' ? 'You' : 'The buyer'} paid ${toStandardUnit(payment)} ${standardUnit} to the contract.`) },
    reportCancellation: () => { console.log(`${role == 'buyer' ? 'You' : 'The buyer'} cancelled the order.`); }
});

if (role === 'seller') {
    const sellerInteract = {
        ...commonInteract(role),
        price: toAtomicUnit(5),
        wisdom: await ask.ask('Enter a wise phrase, or press Enter for default:', (_wisdom) => {
            if (!_wisdom) {
                console.log(_wisdom);
            }
            return _wisdom || 'Build healthy communities.';
        }),
        reportReady: async (price) => {
            console.log(`Your wisdom is for sale at ${toStandardUnit(price)} ${standardUnit}.`);
            console.log(`Contract info: ${JSON.stringify(await contract.getInfo())}`);
        },
    };

    const account = await stdlib.newTestAccount(initialBalance);
    await showBalance(account);
    const contract = account.contract(backend);
    await contract.participants.Seller(sellerInteract);
    await showBalance(account);

} else {
    const buyerInteract = {
        ...commonInteract(role),
        confirmPurchase: async (price) => await ask.ask(`Do you want to purchase wisdom for ${toStandardUnit(price)} ${standardUnit}?`, ask.yesno),
        reportWisdom: (wisdom) => console.log(`Your new wisdom is "${wisdom}"`),
    };

    const account = await stdlib.newTestAccount(initialBalance);
    const info = await ask.ask('Paste contract info:', (s) => JSON.parse(s));
    const contract = account.contract(backend, info);
    await showBalance(account);
    await contract.participants.Buyer(buyerInteract);
    await showBalance(account);
};

ask.done();
