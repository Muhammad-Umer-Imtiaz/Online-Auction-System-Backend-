import cron from "node-cron";
import { User } from "../Models/userSchema.js";
import { Bid } from "../Models/bidSchema.js";
import { sendMail } from "../utils/sendMail.js";
import { calculateCommission } from "../Controller/commissionProofController.js";
import { Auction } from "../Models/AuctionSchema.js";

export const endedAuctionCron = () => {
  cron.schedule("*/1 * * * *", async () => {
    const now = new Date();
    console.log("Cron for ended auction running...");

    const endedAuctions = await Auction.find({
      endTime: { $lt: now },
      commissionCalculated: false,
    });

    for (const auction of endedAuctions) {
      try {
        const commissionAmount = await calculateCommission(auction._id);
        auction.commissionCalculated = true;

        const highestBidder = await Bid.findOne({
          auctionItem: auction._id,
          amount: auction.currentBid,
        });

        const auctioneer = await User.findById(auction.createdBy);
        console.log(auctioneer);
        if (!auctioneer) {
          console.error(`Auctioneer not found for auction ${auction._id}`);
          continue;
        }

        if (highestBidder) {
          auction.highestBidder = highestBidder.bidder.id;
          await auction.save();

          const bidder = await User.findById(highestBidder.bidder.id);

          await User.findByIdAndUpdate(
            bidder._id,
            {
              $inc: {
                moneySpent: highestBidder.amount,
                auctionsWOn: 1,
              },
            },
            { new: true }
          );

          auctioneer.unpaidComission += commissionAmount;
          await auctioneer.save();

          const subject = `Congratulations! You won the auction for ${auction.title}`;
          const text = `Dear ${bidder.userName}, \n\nCongratulations! You have won the auction for ${auction.title}. \n\nBefore proceeding for payment contact your auctioneer via your auctioneer email:${auctioneer.email} \n\nPlease complete your payment using one of the following methods:\n\n1. **Easypaisa or JazzCash**:\n- You can send payment via Easypaisa or JazzCash: ${auctioneer.phone}\n\n2. **Cash on Delivery (COD)**:\n- If you prefer COD, you must pay 20% of the total amount upfront before delivery.\n- To pay the 20% upfront, use any of the above methods.\n- The remaining 80% will be paid upon delivery.\n- If you want to see the condition of your auction item then send your email on this: ${auctioneer.email}\n\nPlease ensure your payment is completed by [Payment Due Date]. Once we confirm the payment, the item will be shipped to you.\n\nThank you for participating!\n\nBest regards,\nEZ Auction Team`;

          console.log("SENDING EMAIL TO HIGHEST BIDDER");
          await sendMail({ email: bidder.email, subject, text });
          console.log("SUCCESSFULLY SENT EMAIL TO HIGHEST BIDDER");
        } else {
          await auction.save();
        }
      } catch (error) {
        console.error(`Error processing auction ${auction._id}:`, error);
      }
    }
  });
};
