
# 🏗 scaffold-eth - Meta Multi Signature Wallet

> a multi-tenant multi-sig contract

---

The goal of this contract is that anyone should be able to create a job to someone and upon succesful completion of the job, a reward is given. The creator of the multisig instance has a lot of coins but signers have none. Signers have to check if the job has been completed and if so, they send a signature of the relevant data to someone else (for example the creator) to put it on chain. When enough signers have done so, the multisig can be executed and the reward is given.

The goal is also to provide a personal experience and only show relevant data for the connected user (like the speedrunethereum site). In other words: the content of the webpage is adapted to the connected address and only shows the useful information for that address. If you created a contract, you can add and remove signers, send signatures on chain on behalf of the singers or even sign yourself and execute the multisig contract to transfer the reward. If you are a sender, you can only sign or send signatures.

---

I have a Chrome with MetaMask and .1 ether for the contract creation and a FireFox with a burner wallet of 0 funds. Lets create a new multisig instance in the "create" tab.

Let's create a job to let the firefox user drill a hole in the ground and get a reward for it. Both the contract creator and the job executor are the signers, which is not correct, but good for demo purpose.

![image](https://user-images.githubusercontent.com/5307283/155609039-6e4ed762-aa14-4bfd-afbe-6838cce4e936.png)

In the "manage" tab, the multisig creator can add and remove signers.

![image](https://user-images.githubusercontent.com/5307283/155609444-163964ba-20c2-43e0-9ef3-3fc014fdd4fb.png)

If we take a look at the execute tab, we see nothing has been signed yet and the execute button is not visible.

![image](https://user-images.githubusercontent.com/5307283/155609569-8e5a6bc6-452c-4824-a776-e9b6c06452bb.png)

The firefox user has seen the hole in the ground and visits the "sign" tab.

![image](https://user-images.githubusercontent.com/5307283/155610302-fc61fd1a-a46d-4a7a-bd04-9f7384e2c31a.png)

But has no money and copies the signature and nonce (multi sig key) and sends it to the contract creator.

![image](https://user-images.githubusercontent.com/5307283/155610208-de96d229-50e2-4df4-a49a-66f703edec8a.png)

The chrome user receives the signature and nonce by telegram and pastes it in the "send" tab fields.

![image](https://user-images.githubusercontent.com/5307283/155610511-0c69bc79-fc9b-43e4-abc8-387cd3c42cee.png)

Now the creator sees in the "execute" tab the firefox user signature has been accepted.

![image](https://user-images.githubusercontent.com/5307283/155610689-43feb212-c32a-4fa7-891a-2f1f5226b3ec.png)

The chrome user both signs and sends the signature on-chain in the "sign" tab. This is possible if you are coined.

![image](https://user-images.githubusercontent.com/5307283/155611022-52b8713e-8a40-4493-987a-1dbd294bab08.png)

The creator can now execute the multisig.

![image](https://user-images.githubusercontent.com/5307283/155611127-c71fa1a8-41e7-4644-aec2-f29fb08e44b5.png)

The firefox user received the reward.

