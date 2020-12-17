// This test is only invoked if MAINNET_FORK is set
if (process.env.MAINNET_FORK) {
    const Utils = require("./Utils.js");
    const MFC = require("./mainnet-fork-test-config.js");
    const { send } = require("@openzeppelin/test-helpers");
    const BigNumber = require("bignumber.js");
    //const Controller = artifacts.require("Controller");
    //const Storage = artifacts.require("Storage");
    const CurveConverterBUSD = artifacts.require("CurveConverterBUSD");
    const IERC20 = artifacts.require("IERC20");
    //const makeVault = require("./make-vault.js");
  
    BigNumber.config({ DECIMAL_PLACES: 8 });
  
    contract("Mainnet Curve Converter CRV-BUSD", function (accounts) {
      describe(`Curve BUSD`, function () {
        // external contracts
        let underlying;
        let dai;
        let usdc;
        let usdt;
        let busd;
  
        // external setup
        //let underlyingWhale = MFC.THREE_POOL_WHALE_ADDRESS;
        let daiWhale = MFC.DAI_WHALE_ADDRESS;
        let usdcWhale = MFC.USDC_WHALE_ADDRESS;
        let usdtWhale = MFC.USDT_WHALE_ADDRESS;
        let busdWhale = MFC.BUSD_WHALE_ADDRESS;


        // parties in the protocol
        let governance = accounts[1];
        let farmer1 = accounts[3];
  
        // numbers used in tests
        let farmerBalance;
  
        // only used for ether distribution
        let etherGiver = accounts[9];
  
        // Core protocol contracts
        let vault;
  
        async function setupExternalContracts() {
          underlying = await IERC20.at(MFC.BUSD_MIXED_ADDRESS);
          vault = await IERC20.at(MFC.BUSD_VAULT_ADDRESS);
          dai = await IERC20.at(MFC.DAI_ADDRESS);
          usdc = await IERC20.at(MFC.USDC_ADDRESS);
          usdt = await IERC20.at(MFC.USDT_ADDRESS);
          busd = await IERC20.at(MFC.BUSD_ADDRESS);
        }

        async function setupCoreProtocol() {
          converterBUSD = await CurveConverterBUSD.new(
            vault.address,
            underlying.address,
            MFC.BUSD_DEPOSIT_ADDRESS,
            dai.address,
            usdc.address,
            usdt.address,
            busd.address
            );
        }

        async function setupBalance(){
          // Give whale some ether to make sure the following actions are good
          await send.ether(etherGiver, daiWhale, "1" + "000000000000000000");
          await send.ether(etherGiver, usdcWhale, "1" + "000000000000000000");
          await send.ether(etherGiver, usdtWhale, "1" + "000000000000000000");
          await send.ether(etherGiver, busdWhale, "1" + "000000000000000000");
          daiBalance = await dai.balanceOf(daiWhale);
          usdcBalance = await usdc.balanceOf(usdcWhale);
          usdtBalance = await usdt.balanceOf(usdtWhale);
          busdBalance = await busd.balanceOf(busdWhale);
  
          await dai.transfer(farmer1, daiBalance, { from: daiWhale });
          await usdc.transfer(farmer1, usdcBalance, { from: usdcWhale });
          await usdt.transfer(farmer1, usdtBalance, { from: usdtWhale });
          await busd.transfer(farmer1, busdBalance, { from: busdWhale });
        }

        beforeEach(async function () {
            await setupExternalContracts();
            await setupCoreProtocol();
            await setupBalance();
          });
    

        it("A farmer depositing DAI", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let daiBalance = new BigNumber(Math.floor(await dai.balanceOf(farmer1) / 2));
          console.log("deposit DAI: "+daiBalance)
        
          await dai.approve(converterBUSD.address, daiBalance, { from: farmer1 });
          await converterBUSD.depositAll([daiBalance, 0, 0, 0], 0, { from: farmer1 });    
          
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fCRV-BUSD Balance: " + farmerNewBalance)
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });

        it("A farmer depositing USDC", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let usdcBalance = new BigNumber(Math.floor(await usdc.balanceOf(farmer1) / 2));
          console.log("deposit USDC: "+usdcBalance)
        
          await usdc.approve(converterBUSD.address, usdcBalance, { from: farmer1 });
          await converterBUSD.depositAll([0, usdcBalance, 0, 0], 0, { from: farmer1 });    
          
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fCRV-BUSD Balance: " + farmerNewBalance)
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });

        it("A farmer depositing USDT", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let usdtBalance = new BigNumber(Math.floor(await usdt.balanceOf(farmer1) / 2));
          console.log("deposit USDT: "+usdtBalance)
        
          await usdt.approve(converterBUSD.address, usdtBalance, { from: farmer1 });
          await converterBUSD.depositAll([0, 0, usdtBalance, 0], 0, { from: farmer1 });    
          
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fCRV-BUSD Balance: " + farmerNewBalance)
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });

        it("A farmer depositing BUSD", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let busdBalance = new BigNumber(Math.floor(await busd.balanceOf(farmer1) / 2));
          console.log("deposit BUSD: "+busdBalance)
        
          await busd.approve(converterBUSD.address, busdBalance, { from: farmer1 });
          await converterBUSD.depositAll([0, 0, 0, busdBalance], 0, { from: farmer1 });    
          
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fCRV-BUSD Balance: " + farmerNewBalance)
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });
        it("A farmer depositing DAI, USDC, USDT and BUSD", async function () {
          let farmerOldBalance = new BigNumber(await vault.balanceOf(farmer1));
          let daiBalance = new BigNumber(Math.floor(await dai.balanceOf(farmer1) / 2));
          let usdcBalance = new BigNumber(Math.floor(await usdc.balanceOf(farmer1) / 2));
          let usdtBalance = new BigNumber(Math.floor(await usdt.balanceOf(farmer1) / 2));
          let busdBalance = new BigNumber(Math.floor(await busd.balanceOf(farmer1) / 2));
          console.log("deposit DAI: "+daiBalance)
          console.log("deposit USDC: "+usdcBalance)
          console.log("deposit USDT: "+usdtBalance)
          console.log("deposit BUSD: "+busdBalance)

          await dai.approve(converterBUSD.address, daiBalance, { from: farmer1 });
          await usdc.approve(converterBUSD.address, usdcBalance, { from: farmer1 });
          await usdt.approve(converterBUSD.address, usdtBalance, { from: farmer1 });
          await busd.approve(converterBUSD.address, busdBalance, { from: farmer1 });
          await converterBUSD.depositAll([daiBalance, usdcBalance, usdtBalance, busdBalance], 0, { from: farmer1 });    
          
          let farmerNewBalance = new BigNumber(await vault.balanceOf(farmer1));
          console.log("farmer fCRV-BUSD Balance: " + farmerNewBalance)
          Utils.assertBNGt(farmerNewBalance, farmerOldBalance);
        });
        });
      });
    }
    