import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.pass,
  },
});

// Email templates
const customerWelcomeEmail = (name: string) => ({
  subject: 'Welcome to Our Food Delivery Platform!',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Welcome to Our Food Delivery Platform!</h2>
      <p>Dear ${name},</p>
      <p>Thank you for joining our food delivery platform! We're excited to have you on board.</p>
      
      <h3 style="color: #2c3e50;">What you can do with your account:</h3>
      <ul>
        <li>Browse through hundreds of restaurants</li>
        <li>Order your favorite meals</li>
        <li>Track your orders in real-time</li>
        <li>Save your favorite restaurants</li>
        <li>Get exclusive deals and offers</li>
        <li>Rate and review your orders</li>
      </ul>

      <p>Start exploring our platform and enjoy delicious meals delivered to your doorstep!</p>
      
      <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
        <h4 style="color: #2c3e50;">Need Help?</h4>
        <p>Our customer support team is available 24/7 to assist you.</p>
        <p>Email: support@fooddelivery.com</p>
        <p>Phone: 1-800-FOOD-HELP</p>
      </div>

      <p style="margin-top: 30px;">Best regards,<br>The Food Delivery Team</p>
    </div>
  `,
});

const restaurantOwnerWelcomeEmail = (name: string) => ({
  subject: 'Welcome to Our Restaurant Partner Program!',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Welcome to Our Restaurant Partner Program!</h2>
      <p>Dear ${name},</p>
      <p>Thank you for choosing to partner with us! We're excited to help you grow your restaurant business.</p>
      
      <h3 style="color: #2c3e50;">What you can do with your account:</h3>
      <ul>
        <li>Manage your restaurant profile</li>
        <li>Update your menu items and prices</li>
        <li>Track orders in real-time</li>
        <li>View detailed analytics and reports</li>
        <li>Manage customer reviews</li>
        <li>Set special offers and promotions</li>
      </ul>

      <h3 style="color: #2c3e50;">Next Steps:</h3>
      <ol>
        <li>Complete your restaurant profile</li>
        <li>Add your menu items with images and descriptions</li>
        <li>Set your operating hours</li>
        <li>Configure delivery settings</li>
      </ol>

      <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
        <h4 style="color: #2c3e50;">Partner Support</h4>
        <p>Our partner support team is here to help you succeed.</p>
        <p>Email: partners@fooddelivery.com</p>
        <p>Phone: 1-800-PARTNER</p>
      </div>

      <p style="margin-top: 30px;">Best regards,<br>The Food Delivery Partner Team</p>
    </div>
  `,
});

// Approval email template
const approvalEmail = (name: string) => ({
  subject: 'Your Restaurant Owner Account Has Been Approved!',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Congratulations, ${name}!</h2>
      <p>Your restaurant owner account has been approved by our admin team.</p>
      <p>You can now log in and start managing your restaurant, menu, and orders.</p>
      <p>Welcome aboard!</p>
      <p style="margin-top: 30px;">Best regards,<br>The Food Delivery Team</p>
    </div>
  `,
});

export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  try {
    // Get user data from Firestore
    const userDoc = await admin.firestore().collection('users').doc(user.uid).get();
    const userData = userDoc.data();

    if (!userData) {
      console.error('No user data found for:', user.uid);
      return;
    }

    const { role, displayName } = userData;
    const email = user.email;

    if (!email) {
      console.error('No email found for user:', user.uid);
      return;
    }

    // Prepare email based on user role
    let emailContent;
    if (role === 'restaurant_owner') {
      emailContent = restaurantOwnerWelcomeEmail(displayName || 'Restaurant Owner');
    } else if (role === 'customer') {
      emailContent = customerWelcomeEmail(displayName || 'Customer');
    } else {
      return; // Don't send email for other roles
    }

    // Send welcome email
    await transporter.sendMail({
      from: functions.config().email.user,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log('Welcome email sent to:', email);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
});

export const onOwnerApproval = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only send if isApproved changed from false to true and role is restaurant_owner
    if (
      before.role === 'restaurant_owner' &&
      before.isApproved === false &&
      after.isApproved === true
    ) {
      const email = after.email;
      const displayName = after.displayName || 'Restaurant Owner';
      try {
        await transporter.sendMail({
          from: functions.config().email.user,
          to: email,
          subject: approvalEmail(displayName).subject,
          html: approvalEmail(displayName).html,
        });
        console.log('Approval email sent to:', email);
      } catch (error) {
        console.error('Error sending approval email:', error);
      }
    }
  }); 