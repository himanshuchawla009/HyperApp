
const config = {
     jwtSecret:"aSecretWhichIsNoMoreASecret",
         /** in seconds */
    tokenExpiryTime: 24 * 60 * 60, // 1 day
    adminEmail:'admin@elamachain.io',
    password:'admin#elama',
    org1User:'organisationOneUser',
    org2User:'organisactionTwoUser',
    org1Name:'Org1',
    org2Name:'Org2',
    chaincodeName:"elamachain",
	chaincodePath:"github.com/example_cc/go",
	chaincodeType: "golang",
    chaincodeVersion:"v0",
    delimiter:'.ELAMA.',
    channelName:'mychannel'


}

module.exports = config;