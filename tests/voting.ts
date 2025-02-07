import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Voting } from "../target/types/voting";
import { BankrunProvider, startAnchor } from 'anchor-bankrun';
import { PublicKey } from '@solana/web3.js';
import { expect } from "chai";
const IDL = require('../target/idl/voting.json');
const votingAddress = new PublicKey('18maLjJs5ZXfmeAzSgq5mNyNK5QoZrbUYUMFW6CC3XR');

describe("voting", () => {

  it("Initialize Poll ", async () => {
    const context = await startAnchor("", [{ name: 'Voting', programId: votingAddress }], []);
    const provider = new BankrunProvider(context);

    const votingProgram = new Program<Voting>(
      IDL,
      provider,
    );

    const pollId = new BN(1);
    const start = new BN(0);
    const end = new BN(1800000000);

    await votingProgram.methods.initializePoll(
      pollId,
      start,
      end,
      " What's your favorite fruit?"
    ).rpc();

    const [pollAccountAddress] = PublicKey.findProgramAddressSync(
      // seeds
      [pollId.toArrayLike(Buffer, 'le', 8)],
      votingProgram.programId
    );

    const poll = await votingProgram.account.poll.fetch(pollAccountAddress);
    expect(poll.pollId.eq(pollId));
    expect(poll.description).to.eq(" What's your favorite fruit?");
    expect(poll.pollStart.eq(start));
    expect(poll.pollEnd.eq(end));
    expect(poll.pollStart.toNumber()).lessThan(poll.pollEnd.toNumber());
    
  });
});
