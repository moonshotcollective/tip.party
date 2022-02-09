import { ethers } from 'ethers'

// fetch list of hashes that the user haven't confirmed

export default async function fetchTransaction(provider, hash) {
    const tx = await provider.waitForTransaction(hash, 1);

    if (tx.status === 1){
        return tx.from;
    }
    else{
        return null;
    }
}

// loop through the hashes

