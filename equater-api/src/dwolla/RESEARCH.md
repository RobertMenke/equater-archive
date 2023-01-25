## Resources

-   [ACH Debit vs ACH Credit](https://www.actumprocessing.com/ach-credit-vs-ach-debit/)
-   [Stripe Sources API](https://stripe.com/docs/api/sources/create)
-   [Can Stripe Send Money to 3rd Parties?](https://stackoverflow.com/a/42188303/4313362)
-   [Sending Money with Dwolla](https://developers.dwolla.com/guides/send-money/)

## ACH Debit vs ACH Credit

#### What is an ACH Debit and how does it work?

-   ACH Debits are the most common ACH transaction type. They’re used by merchants to pull money directly from
    customers’ accounts

#### What is an ACH Credit and how does it work?

-   ACH Credits happen when money gets deposited into a Receiver’s account, rather than being deducted like an ACH Debit

#### How do we use ACH Debit and ACH Credit

~Stripe provides the ability to create a "source" that can be an ACH debit or ACH credit source. We'll create 2 sources
per customer - 1 debit source for cases where we need to charge them, and 1 credit source for when we need to pay them.~
