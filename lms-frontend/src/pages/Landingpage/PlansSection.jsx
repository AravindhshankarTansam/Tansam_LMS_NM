import React from "react";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Stack,
} from "@mui/material";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import GroupsIcon from "@mui/icons-material/Groups";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import "./PlansSection.css"; // 👈 Import CSS file

const PlansSection = () => {
  const teamPlanFeatures = [
    "Access to 13,000+ top courses",
    "Certification prep",
    "Goal-focused recommendations",
    "AI-powered coaching",
    "Analytics and adoption reports",
  ];

  const enterprisePlanFeatures = [
    "Access to 30,000+ top courses",
    "Certification prep",
    "Goal-focused recommendations",
    "AI-powered coaching",
    "Advanced analytics and insights",
    "Dedicated customer success team",
    "Customizable content",
    "Hands-on tech training",
    "Strategic implementation services",
  ];

  return (
    <section className="plans-section">
      {/* Header */}
      <Box textAlign="center" mb={6}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Grow your team's skills and your business
        </Typography>
        <Typography color="text.secondary" fontSize="1rem">
          Reach goals faster with one of our plans or programs. Try one free
          today or contact sales to learn more.
        </Typography>
      </Box>

      {/* Cards Row */}
      <Box className="plans-row">
        {/* TEAM PLAN */}
        <Card className="plan-card">
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Team Plan
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <PeopleAltIcon color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                2 to 10 people – For your team
              </Typography>
            </Stack>

            <Button fullWidth variant="contained" className="plan-btn">
              Start subscription
            </Button>

            <Typography fontWeight="bold">₹2,000 a month per user</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Billed annually. Cancel anytime.
            </Typography>

            <Stack spacing={1}>
              {teamPlanFeatures.map((item) => (
                <Stack key={item} direction="row" spacing={1} alignItems="center">
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography variant="body2">{item}</Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* ENTERPRISE PLAN */}
        <Card className="plan-card">
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Enterprise Plan
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <GroupsIcon color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                More than 20 people – For your whole organization
              </Typography>
            </Stack>

            <Button fullWidth variant="contained" className="plan-btn">
              Request a demo
            </Button>

            <Typography fontWeight="bold" mb={2}>
              Contact sales for pricing
            </Typography>

            <Stack spacing={1}>
              {enterprisePlanFeatures.map((item) => (
                <Stack key={item} direction="row" spacing={1} alignItems="center">
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography variant="body2">{item}</Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* AI FLUENCY */}
        <Card className="plan-card">
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              AI Fluency
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <AutoAwesomeIcon color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                From AI foundations to Enterprise transformation
              </Typography>
            </Stack>

            <Button fullWidth variant="contained" className="plan-btn">
              Contact Us
            </Button>

            <Stack spacing={4}>
              <Box>
                <Typography fontWeight="bold">AI Readiness Collection</Typography>
                <Typography variant="body2" color="text.secondary">
                  👥 More than 100 people
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Build org-wide AI fluency fast with 50 curated courses + AI
                  Assistant to accelerate learning.
                </Typography>
              </Box>

              <Box>
                <Typography fontWeight="bold">AI Growth Collection</Typography>
                <Typography variant="body2" color="text.secondary">
                  👥 More than 20 people
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Scale AI and technical expertise with 800+ specialized courses
                  and 30+ role-specific learning paths in multiple languages.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </section>
  );
};

export default PlansSection;
