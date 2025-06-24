import { Container, Typography, Box, Paper } from '@mui/material';

const TermsAndConditions = () => {

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 4 } }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', color: 'primary.main' }}>
          Terms and Conditions
        </Typography>
        <Typography variant="subtitle2" align="center" color="text.secondary" sx={{ mb: 3 }}>
          Last updated: June 19, 2025
        </Typography>

        <Box sx={{ my: 2, borderBottom: 1, borderColor: 'divider' }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body1" paragraph>
            By accessing or creating an account with Saved & Single (“we”, “us”, “our”), you agree to be bound by these Terms and Conditions, our Privacy Policy, and any applicable Event Terms. If you do not agree, you must not use or attend our services.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            2. Eligibility
          </Typography>
          <Typography variant="body1" paragraph>
            You must be between 20 and 40 years old and have the legal capacity to enter into contracts in your jurisdiction. By registering, you represent and warrant that you meet these criteria.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            3. Account Registration & Payment
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>3.1 Account Information</strong> – You agree to provide accurate, current information and keep it updated.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>3.2 Payment Terms</strong> – Fees for events, subscriptions, or services are due as specified at checkout. Unless otherwise stated, payments are non‑refundable. We may accept external processors (e.g., Stripe).
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>3.3 Refunds & Cancellations</strong> – We reserve the right to cancel events or services; in that case, we'll notify you and issue a refund or credit at our discretion.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            4. User Conduct & Safety
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>4.1 Code of Conduct</strong> – You must act respectfully toward users and staff. Harassment, discrimination, fraud, or illegal behavior may result in suspension or removal.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>4.2 Reporting Misconduct</strong> – We encourage you to report any concerns; we will promptly investigate and may restrict or terminate accounts as needed.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>4.3 No Guarantees</strong> – We do not guarantee matches, relationships, or any outcomes from events or services.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            5. Photography, Recording & Publicity Release
          </Typography>
          <Typography variant="body1" paragraph>
            By attending events, you consent to being photographed, filmed, or recorded, and to our use of your likeness for marketing across digital and physical platforms. If you wish to withdraw consent for future use, please contact us at savedandsingle.events@gmail.com, and we will make reasonable efforts to comply.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            6. Intellectual Property
          </Typography>
          <Typography variant="body1" paragraph>
            All materials provided by us are our property or used under license. You retain ownership of your user-generated content but grant us a perpetual, royalty-free license to use it for our services. You agree not to copy or exploit our content without explicit permission.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            7. Privacy & Data
          </Typography>
          <Typography variant="body1" paragraph>
            We process your personal information per our Privacy Policy, in line with applicable laws (e.g., GDPR, CCPA). Third-party services, such as Stripe, manage their own data per their privacy terms.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            8. Limitations of Liability & Disclaimers
          </Typography>
          <Typography variant="body1" paragraph>
            To the fullest extent permitted by law:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1">
                Our services and events are provided "as-is," with no warranties of any kind.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                We will not be liable for any direct, indirect, incidental, special, or consequential damages arising from your use of our services or attendance at events.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Our maximum liability will not exceed the total amount you have paid to us in the 12 months preceding a claim.
              </Typography>
            </li>
          </ul>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            9. Indemnification
          </Typography>
          <Typography variant="body1" paragraph>
            You agree to indemnify and hold harmless Saved & Single and its affiliates, officers, agents, and staff against any claims, damages, losses, or expenses arising from your violation of these Terms or misuse of services.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            10. Dispute Resolution & Governing Law
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>10.1 Governing Law</strong> – These Terms are governed by the laws of Pennsylvania without regard to conflict-of-law principles.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>10.2 Arbitration & Waiver</strong> – Any dispute or claim arising under these Terms will be resolved via binding individual arbitration under the American Arbitration Association's Consumer Arbitration Rules. Class or representative claims are waived.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>10.3 Opt-Out</strong> – You may opt out of arbitration within 30 days of first agreeing to these Terms by emailing us at savedandsingle.events@gmail.com.
          </Typography>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            11. Changes to Terms
          </Typography>
          <Typography variant="body1" paragraph>
            We may update these Terms at any time. Significant changes will be communicated via email or in-app notice. Continued use after changes constitutes acceptance.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            12. Severability
          </Typography>
          <Typography variant="body1" paragraph>
            If any provision is found invalid or unenforceable, that provision will be limited or removed to the minimum extent necessary, and the remaining terms will remain in effect.
          </Typography>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            13. Entire Agreement
          </Typography>
          <Typography variant="body1" paragraph>
            These Terms (including referenced policies) constitute the entire agreement between you and us concerning your use of our services and supersede any prior agreements.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
            14. Contact Us
          </Typography>
          <Typography variant="body1" paragraph>
            For questions or concerns about these Terms, reach out via:
          </Typography>
          <ul>
            <li>
              <Typography variant="body1">
                Email: savedandsingle.events@gmail.com
              </Typography>
            </li>
          </ul>
        </Box>

      </Paper>
    </Container>
  );
};

export default TermsAndConditions; 