
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
    chaincodeName:"elamachainV1",
	chaincodePath:"github.com/example_cc/go",
	chaincodeType: "golang",
    chaincodeVersion:"v1",
    delimiter:'.ELAMA.',
    channelName:'mychannel',
    adminAddress : "586f1462d8cba7572d842002e0bcf63f057d8a6c0d42274d40b74b9ce323cdd7",
	adminPublicKey : "40da80c28a2248e4d07bb5c4829cbdae7551d8fd62b57881a293e07350c2966c9359a2306b42bc62840ff7fb0e0004dfd4d9bccfbc2a742c17f3e222a302a4c4"


}

module.exports = config;