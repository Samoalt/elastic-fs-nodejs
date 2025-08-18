function userWalletAccount(userId, currency){
  const prefix = process.env.ACCOUNT_PREFIX || 'users';
  return `${prefix}:${userId}:wallet:${currency}`;
}
function holdAccount(holdId){
  return `holds:${holdId}`;
}
module.exports = { userWalletAccount, holdAccount };
