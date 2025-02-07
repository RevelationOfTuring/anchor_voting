import { Program, BN } from "@coral-xyz/anchor";
import { Voting } from "../target/types/voting";
import { BankrunProvider, startAnchor } from 'anchor-bankrun';
import { PublicKey } from '@solana/web3.js';
import { expect } from "chai";
const IDL = require('../target/idl/voting.json');
const votingAddress = new PublicKey('18maLjJs5ZXfmeAzSgq5mNyNK5QoZrbUYUMFW6CC3XR');

describe("voting", () => {
  let context;
  let provider;
  let votingProgram: Program<Voting>;
  let candidate1Address;
  let candidate2Address;
  let pollAccountAddress;

  before(async () => {
    context = await startAnchor("", [{ name: 'Voting', programId: votingAddress }], []);
    provider = new BankrunProvider(context);

    votingProgram = new Program<Voting>(
      IDL,
      provider,
    );
  })

  it("Initialize Poll", async () => {
    const pollId = new BN(1);
    const start = new BN(0);
    const end = new BN(1800000000);

    await votingProgram.methods.initializePoll(
      pollId,
      start,
      end,
      " What's your favorite fruit?"
    ).rpc();

    [pollAccountAddress] = PublicKey.findProgramAddressSync(
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


  it("initialize candidate", async () => {
    const pollId = new BN(1);
    await votingProgram.methods.initializeCandidate(
      pollId,
      "apple"
    ).rpc();

    [candidate1Address] = PublicKey.findProgramAddressSync(
      [pollId.toArrayLike(Buffer, 'le', 8), Buffer.from("apple")],
      votingProgram.programId,
    );

    const candidate1 = await votingProgram.account.candidate.fetch(candidate1Address);
    expect(candidate1.name).eq("apple");
    expect(candidate1.votes.toNumber()).eq(0);

    let poll = await votingProgram.account.poll.fetch(pollAccountAddress);
    expect(poll.candidateAmount.toNumber()).eq(1);

    await votingProgram.methods.initializeCandidate(
      pollId,
      "banana"
    ).rpc();

    [candidate2Address] = PublicKey.findProgramAddressSync(
      [pollId.toArrayLike(Buffer, 'le', 8), Buffer.from("banana")],
      votingProgram.programId,
    );

    const candidate2 = await votingProgram.account.candidate.fetch(candidate2Address);
    expect(candidate2.name).eq("banana");
    expect(candidate2.votes.toNumber()).eq(0);

    poll = await votingProgram.account.poll.fetch(pollAccountAddress);
    expect(poll.candidateAmount.toNumber()).eq(2);
  })

  it("vote ", async () => {
    const pollId = new BN(1);
    await votingProgram.methods.vote(
      pollId,
      "apple"
    ).rpc();

    let candidate = await votingProgram.account.candidate.fetch(candidate1Address);
    expect(candidate.votes.toNumber()).eq(1);

    await votingProgram.methods.vote(
      pollId,
      "apple"
    ).rpc();

    candidate = await votingProgram.account.candidate.fetch(candidate1Address);
    expect(candidate.votes.toNumber()).eq(2);

    await votingProgram.methods.vote(
      pollId,
      "banana"
    ).rpc();

    candidate = await votingProgram.account.candidate.fetch(candidate2Address);
    expect(candidate.votes.toNumber()).eq(1);

    await votingProgram.methods.vote(
      pollId,
      "banana"
    ).rpc();

    candidate = await votingProgram.account.candidate.fetch(candidate2Address);
    expect(candidate.votes.toNumber()).eq(2);
  })
});
