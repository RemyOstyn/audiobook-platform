# Senior Full Stack Engineer - Case Study

## Objective

Build an audiobook e-commerce store where users can browse titles, view details, and add selections to their cart for checkout. Include an admin panel to upload new audiobooks and generate product detail pages with AI-powered summaries and transcriptions.

## Task Description

This assessment focuses on both implementation and testing. We want to see how you structure a real product with some backend logic and a bit of AI integration.

You can use any two of the following technologies: Next.js, Golang, or Python. You are free to pick any database you are comfortable with.

### Part 1: Build the core features

Your app should support the following:

- Email and password authentication with Google login as an option
- Password reset
- User roles (admin and regular user)
- Admin should be able to upload audiobook files, which are then transcribed using an AI service to create AI description for these audiobook on the product detailed page. The system should also auto-tag the book with up to three relevant categories
- Users should be able to browse audio books, add items to a cart, simulate a checkout, and view or download the book with its transcription after purchase

**Note: You do not need to integrate real payments. Just mock the flow.**

Please also include a simple architecture diagram so we can understand how you put things together. This could be drawn using a tool like Whimsical or even sketched out and screenshotted.

### Part 2: Add testing and failure handling

Write test cases for the backend logic, such as your service and controller functions

Think about edge cases. What happens if the AI service fails or a file upload is interrupted?

Implement graceful handling for at least one failure scenario

Keep it practical. We're not looking for 100 percent coverage, just a thoughtful approach to testing and reliability.

## What to Submit

1. A link to your GitHub repository
2. A short README explaining how to set things up and what decisions you made
3. Any architecture diagrams or supporting files
4. If applicable, test reports or load testing results

**Optional**: a link to a live demo or video walkthrough

If you have questions or need more time, just let us know. We're excited to see your work. Let us know how we can support you in doing your best.