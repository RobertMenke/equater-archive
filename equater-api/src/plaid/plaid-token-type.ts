// Android has a slightly different oauth mechanism than web/ios. Android
// uses package name to handle app <-> app communication and the other
// platforms use the redirect_uri. Unfortunately Plaid isn't smart enough
// to use the right one at the right time, so we have to issue multiple tokens.
export enum PlaidTokenType {
    DEPOSITORY_ONLY = 'DEPOSITORY_ONLY',
    CREDIT_AND_DEPOSITORY = 'CREDIT_AND_DEPOSITORY',
    ANDROID_DEPOSITORY_ONLY = 'ANDROID_DEPOSITORY_ONLY',
    ANDROID_CREDIT_AND_DEPOSITORY = 'ANDROID_CREDIT_AND_DEPOSITORY',
    ITEM_UPDATE = 'ITEM_UPDATE',
    ANDROID_ITEM_UPDATE = 'ANDROID_ITEM_UPDATE'
}
