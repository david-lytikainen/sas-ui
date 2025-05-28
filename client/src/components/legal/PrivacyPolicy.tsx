import { Container, Typography, Box, Paper } from '@mui/material';

const PrivacyPolicy = () => {

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 4 } }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', color: 'primary.main' }}>
          Privacy Policy for Saved & Single
        </Typography>
        <Typography variant="subtitle2" align="center" color="text.secondary" sx={{ mb: 3 }}>
          Last updated: May 27, 2025 
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
                <strong>Birthday:</strong> Provided at sign-up. Needed to verify you meet age requirements and to show age-based matches (if applicable). We verify you are between 20 and 30 years old for our specific service.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Email address:</strong> Provided at sign-up. Needed for login, password resets, and account notices.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Phone number:</strong> Provided at sign-up. Used for account verification, and potentially for SMS alerts if you opt-in.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Gender:</strong> Provided at sign-up. Used to facilitate matching within our events.
              </Typography>
            </li>
          </ul>
          <Typography variant="body1" paragraph>
            We do not collect profile photos or direct messages between users.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            3. How we protect your data
          </Typography>
          <Typography variant="body1" component="div" paragraph>
            <ul>
              <li>Traffic between your device and our servers uses TLS 1.3.</li>
              <li>Personal data fields are stored using AES-256 encryption at rest.</li>
              <li>Passwords are salted and hashed with bcrypt.</li>
            </ul>
          </Typography>
          <Typography variant="body1" paragraph>
            No system is perfectly secure. By using Saved & Single you accept this risk.
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
                Contact you – service updates, match notifications, and other important information.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Keep the platform safe – verify age, prevent fake accounts, and investigate abuse reports.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Other purposes you agree to by signing up – research about dating trends (using aggregated or anonymized data), improving our product, and limited marketing of Saved & Single or its future features. Any external reports use aggregated or anonymized data, never your direct contact details.
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
                <strong>Hosting and email service providers:</strong> To run the app and send messages to you.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Researchers or partners (anonymized data only):</strong> To study aggregated trends and improve the service.
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
                <strong>Active accounts:</strong> Until you request to delete your account.
              </Typography>
            </li>
          </ul>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            7. Your choices and rights
          </Typography>
          <Typography variant="body1" paragraph>
            Depending on where you live, you may:
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
            <li>
              <Typography variant="body1">Complain to a data-protection authority.</Typography>
            </li>
          </ul>
          <Typography variant="body1" paragraph>
            Write to savedandsingle.events@gmail.com and we'll respond within 30 days.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            8. Children and Age Restrictions
          </Typography>
          <Typography variant="body1" paragraph>
            You must be at least 20 years old and no older than 30 years old to use Saved & Single. We may delete any account that violates our terms.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            9. Changes to this policy
          </Typography>
          <Typography variant="body1" paragraph>
            If we make significant changes, we'll email you or post an in-app notice at least 30 days before they take effect. Using the service after that date means you accept the new policy.
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