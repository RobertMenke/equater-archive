## Transaction Web Hook Payments

Users of Equater will have the option to specify that they want to split the cost of a particular vendor with
friends/family/etc. This document outlines some of the challenges and solutions to those challenges involved in making
this process work smoothly. The primary operational challenge has to do with reliable vendor identification.

## Problem

#### Objective

We want to have a single, atomic friendly name, logo, and ideally an ACH PPD_ID for a given vendor so that customers can
easily and reliably identify which vendor's cost they'd like to split.

#### Challenges

-   We're not guaranteed that the vendor charging our users will provide an ACH PPD_ID.
-   We're not guaranteed that the vendor charging our users will provide a friendly name. For example the vendor "Ray
    Wenderlich", may come in as "XX_R_wlich_monthly".
-   We want users and staff to be able to quickly search based on a friendly name or ACH PPD_ID (only staff would care
    about the latter)
-   We want transactions that come from a parent company to be able to be associated with a more specific entity. For
    example, my apartment is owned by TRG Management Group, but I'd want to search for Icon Central to pay my apartment
    bill.

## Operational Solution

#### Process

-   Any time we process a vendor that we don't recognize it will be marked as "Requires Internal Review"
-   We will maintain an internal dashboard that lists all vendor that require internal review (in addition to a view
    that allows staff to search all vendors)
-   Someone from our team will need to take 1 of 2 actions for each vendor that we don't recognize
    1. Associate the vendor name with a vendor we've already reviewed. For example, after research we may find that
       "XX_R_wlich_monthly" is actually just a transaction name used by the vendor "Ray Wenderlich".
    2. Fill out the Friendly Name, Logo, and PPD ID (if we can find it) for that vendor. In this case
       "XX_R_wlich_monthly" truly is a vendor ("Ray Wenderlich") that we haven't seen before.

The following resources may be useful for quickly finding company logos: - http://instantlogosearch.com/

#### Considerations

-   What kind of checks and balances might we need to put in place to ensure that we're using quality brand assets, not
    misrepresenting vendors, and avoiding mistaken associations?
-   If the number of transactions we need to associate proves to be overwhelming can we outsource labor efficiently via
    something like Amazon's Mechanical Turk program? https://www.mturk.com/

## Technical Solution (see resources/Equater.mwb for the database ERD)

#### Database notes:

`unique_vendor` is a table that can have many associated `transaction` and many associated `vendor_transaction_name`. A
transaction is always associated with 1 `unique_vendor` and a transaction name (like "XX_R_wlich_monthly") is always
associated with a unique vendor, like "Ray Wenderlich".

#### In english, doc

Any time we process a new transaction we associate it with a "Unique Vendor". This means that prior to storing a new
transaction we must find or create a unique vendor.

The recipe goes like this:

-   Search for unique vendors in the `unique_vendor` table by PPD_ID
-   Fallback to searching vendor transaction names by name
-   If vendor transaction name is found in step 2, use it to look up the unique vendor
-   If it's not found create both a vendor transaction name and a unique vendor and mark the unique vendor as requiring
    review
-   If there's no existing agreement for the unique vendor, check out if there's an agreement with an associated unique
    vendor (ex: Icon Central -> TRG Management Group)
