import cron from "node-cron";
import { User } from "../Models/userSchema.js";
import { PaymentProof } from "../Models/commisionProofSchema.js";
import { Commission } from "../Models/commisonSchema.js";
import { sendMail } from "../utils/sendMail.js";
export const verifyCommissionCron = () => {
  cron.schedule("*/1 * * * *", async () => {
    console.log("Running Verify Commission Cron...");

    const approvedProofs = await PaymentProof.find({ status: "Approved" });

    for (const proof of approvedProofs) {
      try {
        const user = await User.findById(proof.userId);
        if (!user) continue;
        let updatedUserData;
        if (user.unpaidComission >= proof.amount) {
          updatedUserData = await User.findByIdAndUpdate(
            user._id,
            {
              $inc: { unpaidComission: -proof.amount },
            },
            { new: true }
          );
        } else {
          updatedUserData = await User.findByIdAndUpdate(
            user._id,
            {
              unpaidComission: 0,
            },
            { new: true }
          );
        }

        await PaymentProof.findByIdAndUpdate(proof._id, {
          status: "Settled",
        });

        await Commission.create({
          amount: proof.amount,
          user: user._id,
        });

        const settlementDate = new Date().toLocaleDateString();
        const subject = `Your Payment Has Been Successfully Verified And Settled`;
        const text = `Dear ${user.userName},\n\nWe are pleased to inform you that your recent payment has been successfully verified and settled. Thank you for promptly providing the necessary proof of payment. Your account has been updated, and you can now proceed with your activities on our platform without any restrictions.\n\nPayment Details:\nAmount Settled: ${proof.amount}\nUnpaid Amount: ${updatedUserData.unpaidComission}\nDate of Settlement: ${settlementDate}\n\nBest regards,\nEZ Auction Team`;

        await sendMail({ email: user.email, subject, text });

        console.log(`User ${proof.userId} paid commission of ${proof.amount}`);
      } catch (error) {
        console.error(
          `Error processing commission proof for user ${proof.userId}: ${error.message}`
        );
      }
    }
  });
};
