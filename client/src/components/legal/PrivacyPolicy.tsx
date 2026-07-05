import { Container, Typography, Box, Paper } from '@mui/material';

const PrivacyPolicy = () => {

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 4 } }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', color: 'primary.main' }}>
          Privacy Policy for Saved & Single
        </Typography>
        <Typography variant="subtitle2" align="center" color="text.secondary" sx={{ mb: 3 }}>
          Last updated: July 5, 2026
        </Typography>

        <Box sx={{ my: 2, borderBottom: 1, borderColor: 'divider' }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            1. Why we have a privacy policy
          </Typography>
          <Typography variant="body1" paragraph>
            This document explains what information we collect, how we protect it, and the choices you have. By creating an account you confirm you have read and agree to these terms, including the additional uses described in Section 4.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            2. The information we collect
          </Typography>
          <Typography variant="body1" paragraph>
            We ask for the following pieces of personal data:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1">
                <strong>Name:</strong> Provided at sign-up. Needed so matches see who you are and we can address you correctly.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Birthday:</strong> Provided at sign-up. Needed to verify you meet age requirements and to support age-aware matching when applicable. Users must be at least 18 years old to use the service.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Email address:</strong> Provided at sign-up. Needed for login, password resets, and account notices.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Phone number:</strong> Provided at sign-up. Used as contact information for your account and event-related coordination.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Gender:</strong> Provided at sign-up. Used to facilitate matching within our events.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Church and denomination details:</strong> Provided at sign-up or in your profile. Used for profile display and event participation context.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Event and registration data:</strong> We store the events you create or join, your registration status, check-in status, schedule participation, and your speed-dating selections and matches for completed events.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Payment and payout records:</strong> For paid events, Stripe processes payment details. We store limited payment-related records such as checkout status, amounts, refunds, and connected-account onboarding state.
              </Typography>
            </li>
          </ul>
          <Typography variant="body1" paragraph>
            We do not collect profile photos or in-app direct messages between users.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            3. How we protect your data
          </Typography>
          <Typography variant="body1" component="div" paragraph>
            <ul>
              <li>Passwords are stored as salted password hashes rather than plain text.</li>
              <li>Account access is protected by server-side authentication controls.</li>
              <li>We limit access to production systems to the extent reasonably necessary to operate the service.</li>
            </ul>
          </Typography>
          <Typography variant="body1" paragraph>
            No system is perfectly secure, and we cannot guarantee absolute security.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            4. How we use your data
          </Typography>
          <Typography variant="body1" paragraph>
            We use your information to:
          </Typography>
          <ol>
            <li>
              <Typography variant="body1">
                Provide the service – create your account, manage event registrations, facilitate speed dating schedules and matching, and keep you logged in.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Contact you – password resets, registration confirmations, event reminders, waitlist spot-open notices, and other important service information.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Keep the platform safe – verify age, prevent fake accounts, and investigate abuse reports.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Operate payments and payouts – support paid event registration, Stripe-connected organizer payouts, refund handling, and payment troubleshooting.
              </Typography>
            </li>
          </ol>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            5. When we share information
          </Typography>
          <Typography variant="body1" paragraph>
            We share data only when necessary:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1">
                <strong>Hosting, infrastructure, and email service providers:</strong> To run the app and send messages to you.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Stripe and related payment providers:</strong> To process attendee payments, refunds, and organizer payouts.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Law enforcement:</strong> Only when legally required or to protect users.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>A future buyer of the company:</strong> If ownership changes, your data stays under this policy (you will be told first).
              </Typography>
            </li>
          </ul>
          <Typography variant="body1" paragraph>
            We never sell your personal information to advertisers.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            6. How long we keep information
          </Typography>
          <ul>
            <li>
              <Typography variant="body1">
                <strong>Active accounts and event records:</strong> We keep them while your account remains active and as reasonably needed to operate the service, support organizers and attendees, maintain payment records, and resolve disputes or abuse issues.
              </Typography>
            </li>
          </ul>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            7. Your choices and rights
          </Typography>
          <Typography variant="body1" paragraph>
            Depending on where you live and the laws that apply to you, you may:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1">See a copy of the information we hold about you.</Typography>
            </li>
            <li>
              <Typography variant="body1">Correct inaccurate details.</Typography>
            </li>
            <li>
              <Typography variant="body1">Delete your account and data.</Typography>
            </li>
            <li>
              <Typography variant="body1">Object to certain uses or ask us to limit them.</Typography>
            </li>
            <li>
              <Typography variant="body1">Receive your data in a portable file.</Typography>
            </li>
          </ul>
          <Typography variant="body1" paragraph>
            Write to savedandsingle.events@gmail.com and we will respond within a reasonable time.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            8. Children and Age Restrictions
          </Typography>
          <Typography variant="body1" paragraph>
            You must be at least 18 years old to use Saved & Single. We may delete any account that violates our terms.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            9. Changes to this policy
          </Typography>
          <Typography variant="body1" paragraph>
            If we make significant changes, we may update this page, email you, or post an in-app notice. Your continued use of the service after the updated policy is posted means you accept the revised policy.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            10. Contact us
          </Typography>
          <Typography variant="body1" paragraph>
            Saved & Single Team
            <br />
            {/* Replace with actual address if available, otherwise keep generic or remove */}
            {/* 1234 Example Street, Suite 100 */}
            {/* Anytown, NY 10001, USA */}
            <br />
            Email: savedandsingle.events@gmail.com
            <br />
            {/* Phone: +1-800-123-4567 (Mon–Fri, 9 am–5 pm ET) */}
          </Typography>
        </Box>

        <Box sx={{ my: 2, borderBottom: 1, borderColor: 'divider' }} />

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          By clicking Sign Up or continuing to use Saved & Single, you consent to the collection, use, and sharing of your information as described above.
        </Typography>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicy; 
