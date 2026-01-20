import { sendEmail } from "@/actions/send-email";
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import * as React from "react";

export default function EmailTemplate({
    userName = "",
    type = "Monthly-report",
    data = {}
}) {
    if (type === "monthly-report") {
        return (
            <Html>
                <Head />
                <Preview>Your Monthly Financial Report</Preview>
                <Body style={style.body}>
                    <Container style={style.container}>
                        <Heading style={style.title}>Monthly Financial Report</Heading>
                        <Text style={style.text}>Hello {userName},</Text>
                        <Text style={style.text}>Here’s your financial summary for {data?.month}:</Text>

                        {/* Main Stats */}
                        <Section style={style.statsContainer}>
                            <div style={style.stat}>
                                <Text style={style.text}>Total Income</Text>
                                <Text style={style.heading}>${data?.stats.totalIncome}</Text>
                            </div>
                            <div style={style.stat}>
                                <Text style={style.text}>Total Expenses</Text>
                                <Text style={style.heading}>${data?.stats.totalExpenses}</Text>
                            </div>
                            <div style={style.stat}>
                                <Text style={style.text}>Net</Text>
                                <Text style={style.heading}>${data?.stats.totalIncome - data?.stats.totalExpenses}</Text>
                            </div>
                        </Section>

                        {/* Category Breakdown */}
                        {data?.stats?.byCategory && (
                            <Section style={style.section}>
                                <Heading style={style.heading}>Expenses by Category</Heading>
                                {Object.entries(data?.stats.byCategory).map(
                                    ([category, amount]) => (
                                        <div key={category} style={style.row}>
                                            <Text style={style.text}>{category}</Text>
                                            <Text style={style.text}>${amount}</Text>
                                        </div>
                                    )
                                )}
                            </Section>
                        )}

                        {/* AI Insights */}
                        {data?.insights && (
                            <Section style={style.section}>
                                <Heading style={style.heading}>Wealth Insights</Heading>
                                {data.insights.map((insight, index) => (
                                    <Text key={index} style={style.text}>
                                        • {insight}
                                    </Text>
                                ))}
                            </Section>
                        )}

                        <Section style={style.footer}>
                            <Text style={style.footerText}>Thank you for using our service!</Text>
                        </Section>
                    </Container>
                </Body>
            </Html>
        );
    }

    if (type === "budget-alert") {
        return (
            <Html>
                <Head />
                <Preview>Budget Alert</Preview>
                <Body style={style.body}>
                    <Container style={style.container}>
                        <Heading style={style.title}>Budget Alert</Heading>
                        <Text style={style.text}>Hello {userName},</Text>
                        <Text style={style.text}>
                            You’ve used {data?.percentageUsed.toFixed(1)}% of your monthly budget.
                        </Text>
                        <Section style={style.statsContainer}>
                            <div style={style.stat}>
                                <Text style={style.text}>Budget Amount</Text>
                                <Text style={style.heading}>${data?.budgetAmount}</Text>
                            </div>
                            <div style={style.stat}>
                                <Text style={style.text}>Spent so far</Text>
                                <Text style={style.heading}>${data?.totalExpenses}</Text>
                            </div>
                            <div style={style.stat}>
                                <Text style={style.text}>Remaining</Text>
                                <Text style={style.heading}>${data?.budgetAmount - data?.totalExpenses}</Text>
                            </div>
                        </Section>

                        <Section style={style.footer}>
                            <Text style={style.footerText}>Stay on top of your finances!</Text>
                        </Section>
                    </Container>
                </Body>
            </Html>
        );
    }
}

const style = {
    body: {
        backgroundColor: "#f4f7fb", // Soft gray background
        fontFamily: "'Helvetica Neue', Arial, sans-serif", // Clean and modern font
        color: "#2f2f2f", // Default text color
        padding: "20px 0",
    },
    container: {
        backgroundColor: "#ffffff",
        margin: "0 auto",
        padding: "30px",
        borderRadius: "8px",
        boxShadow: "0 6px 18px rgba(0, 0, 0, 0.1)",
        maxWidth: "600px",
    },
    title: {
        color: "#2c3e50",
        fontSize: "36px",
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: "20px",
    },
    heading: {
        color: "#34495e",
        fontSize: "20px",
        fontWeight: "600",
        marginBottom: "12px",
    },
    text: {
        color: "#7f8c8d",
        fontSize: "16px",
        marginBottom: "12px",
        lineHeight: "1.5",
    },
    section: {
        backgroundColor: "#ecf0f1",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "30px",
    },
    statsContainer: {
        marginTop: "20px",
    },
    stat: {
        backgroundColor: "#fff",
        padding: "15px",
        marginBottom: "10px",
        borderRadius: "6px",
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.05)",
    },
    row: {
        display: "flex",
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: "1px solid #e0e0e0",
    },
    footer: {
        color: "#95a5a6",
        fontSize: "14px",
        textAlign: "center",
        marginTop: "30px",
        paddingTop: "20px",
        borderTop: "1px solid #ecf0f1",
    },
    footerText: {
        fontSize: "16px",
        color: "#7f8c8d",
    },
    button: {
        backgroundColor: "#3498db",
        color: "#ffffff",
        padding: "12px 20px",
        borderRadius: "5px",
        textDecoration: "none",
        fontWeight: "bold",
        display: "inline-block",
        textAlign: "center",
        marginTop: "20px",
    }
};
