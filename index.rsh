'reach 0.1';
'use strict';

export const main = Reach.App(() => {
    const commonInteract = {
        reportCancellation: Fun([], Null),
        reportPayment: Fun([UInt], Null),
    };

    const Seller = Participant('Seller', {
        ...commonInteract,
        price: UInt,
        wisdom: Bytes(128),
        reportReady: Fun([UInt], Null),
    });

    const Buyer = Participant('Buyer', {
        ...commonInteract,
        confirmPurchase: Fun([UInt], Bool),
        reportWisdom: Fun([Bytes(128)], Null)
    });
    init();

    Seller.only(() => { const price = declassify(interact.price); });
    Seller.publish(price);
    Seller.interact.reportReady(price);
    commit();

    Buyer.only(() => {
        const willBuy = declassify(interact.confirmPurchase(price));
    });

    Buyer.publish(willBuy);
    if (!willBuy) {
        commit();
        each([Seller, Buyer], () => interact.reportCancellation());
        exit();
    }
    commit();

    Buyer.pay(price);
    each([Seller, Buyer], () => interact.reportPayment(price));
    commit();

    Seller.only(() => {
        const wisdom = declassify(interact.wisdom);
    });
    Seller.publish(wisdom);
    transfer(price).to(Seller);
    commit();

    Buyer.interact.reportWisdom(wisdom);

    exit();
});
