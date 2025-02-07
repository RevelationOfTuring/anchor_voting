use anchor_lang::prelude::*;

declare_id!("18maLjJs5ZXfmeAzSgq5mNyNK5QoZrbUYUMFW6CC3XR");

#[program]
pub mod voting {
    use super::*;

    pub fn initialize_poll(
        ctx: Context<InitializePoll>,
        poll_id: u64,
        start: u64,
        end: u64,
        description: String,
    ) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        poll.poll_id = poll_id;
        poll.poll_start = start;
        poll.poll_end = end;
        poll.description = description;
        poll.candidate_amount = 0;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(poll_id:u64)]
pub struct InitializePoll<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        space = 8 + Poll::INIT_SPACE,
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump
    )]
    pub poll: Account<'info, Poll>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Poll {
    poll_id: u64,
    #[max_len(280)]
    description: String,
    poll_start: u64,
    poll_end: u64,
    candidate_amount: u64,
}
