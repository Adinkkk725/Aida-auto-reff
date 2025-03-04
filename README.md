# AIDA Auto Bot - ADINK725

This is an automated bot for creating new accounts, registering referrals, and completing tasks for the AIDA platform.

## Prerequisites

- Node.js
- npm (Node Package Manager)

## Setup

1. Clone the repository:
   ```sh
   git clone https://github.com/Adinkkk725/Aida-auto-reff.git
   cd Aida-auto-reff
   ```

2. Install the required packages:
   ```sh
   npm install
   ```

3. Add your referral code to `reff.txt`:
   ```sh
   echo "your_referral_code" > reff.txt
   ```

## Running the Script

To run the script, execute the following command:
```sh
node auto_referral_with_tasks_combined.js
```

You will be prompted to enter the number of accounts to create. Follow the instructions, and the bot will handle the rest.

## Files

- `auto_referral_with_tasks_combined.js`: Main script for creating accounts, registering referrals, and completing tasks.
- `reff.txt`: File containing the referral code.
- `new_tokens.txt`: File where tokens of newly created accounts will be saved.
- `wallet.json`: File where wallet details of newly created accounts will be saved.

## License

This project is licensed under the MIT License.
