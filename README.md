# Curve Token Converter 
simple smart contact with basic function to provide liquidity on Curve and then deposit to Harvest vault

## Running test 

first console
```
npx ganache-cli --fork https://mainnet.infura.io/v3/YOUR_TOKEN -u '0x317ae07510d655e3bd355d8612e8dc7c1538dcef' -u '0xaaf5959918b74a6cab04a18987ab73dd9567a8d1' -u '0x8cee3eeab46774c1CDe4F6368E3ae68BcCd760Bf' -u '0x7b00C6505266C837d8BA30BEfd25523f32D69885'
```
second console
```
truffle build && export MAINNET_FORK=True && npx truffle test ./tests/mainnet-fork-converter-3crv.js
```
