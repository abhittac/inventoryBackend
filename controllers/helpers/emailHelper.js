const nodemailer = require("nodemailer");
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Invoice = require("../../models/Invoice");
const SalesOrder = require("../../models/SalesOrder");
const sendInvoiceEmail = async (invoiceId) => {
    try {
        if (!invoiceId) {
            throw new Error("invoiceId are required");
        }

        // Fetch the latest invoice for the given order ID
        const invoice = await Invoice.findOne({ invoice_id: invoiceId }).sort({ createdAt: -1 });

        if (!invoice) {
            return {
                success: false,
                message: "No invoice found for the given order ID."
            };
        }

        console.log("Fetched Invoice:", invoice);
        if (!invoice.order_id) {
            return {
                success: false,
                message: "Invoice does not contain a valid order_id."
            };
        }

        // Fetch corresponding order details
        const order = await SalesOrder.findOne({ orderId: invoice.order_id });
        // return false;
        // Extract order details
        console.log("Fetched order:", order);
        if (!order) {
            return {
                success: false,
                message: "No order found for the given order ID."
            };
        }

        // Convert orderPrice to a number
        const orderPrice = Number(order.orderPrice) || 0;
        const quantity = Number(order.quantity) || 1;

        // Calculate totals
        const subtotal = quantity * orderPrice;
        const gst = subtotal * 0.18; // 18% GST
        const total = subtotal + gst;

        // Email content (HTML)
        const emailContent = `
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; }
                .container { width: 100%; max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 5px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1); }
                .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #ddd; }
                .header img { max-width: 150px; }
                h2 { text-align: center; color: #333; margin-top: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background-color: #f4f4f4; }
                .total-row { font-weight: bold; }
                .footer { text-align: center; margin-top: 20px; font-size: 14px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://inventory-frontend-indol.vercel.app/assets/logo.jpg" alt="Company Logo">
                    <h2>Invoice</h2>
                </div>
                   <p><strong>Company Name:</strong>Thailiwale</p>
                <p><strong>Address:</strong>201/1/4, SR Compound, Dewas Naka, Lasudia Mori, Indore, Madhya Pradesh 452016</p>
                <p><strong>Email:</strong> info@thailiwale.com</p>
                <p><strong>Phone:</strong> +91 7999857050</p>
                <hr>

                <p><strong>Invoice No:</strong> ${invoice.invoice_id}</p>
                <p><strong>Order No:</strong> ${invoice.order_id}</p>
                <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
                <p><strong>Status:</strong> ${invoice.status}</p>

                <h3>Bill To:</h3>
                <p><strong>Name:</strong> ${order.customerName}</p>
                <p><strong>Email:</strong> ${order.email}</p>
                <p><strong>Phone:</strong> ${order.mobileNumber}</p>
                <p><strong>Address:</strong> ${order.address}</p>

                <h3>Order Details:</h3>
                <table>
                    <tr>
                        <th>Job Name</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                    <tr>
                        <td>${order.jobName}</td>
                        <td>${quantity}</td>
                        <td>${orderPrice.toFixed(2)}</td>
                        <td>${subtotal.toFixed(2)}</td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="3">GST (18%)</td>
                        <td>${gst.toFixed(2)}</td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="3">Grand Total</td>
                        <td>${total.toFixed(2)}</td>
                    </tr>
                </table>

                <p class="footer">Thank you for your business! <br> For inquiries, contact us at support@yourcompany.com</p>
            </div>
        </body>
        </html>
    `;

        // Setup Nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "47974993873f54",
                pass: "1fdcda65438582"
            }
        });

        // Email options
        const mailOptions = {
            from: '"Techize Builder" <info@techizebuilder.com>',
            to: order.email,
            subject: 'Your Invoice',
            html: emailContent
        };

        // Send email
        await transporter.sendMail(mailOptions);

        invoice.status = "Sending";
        await invoice.save();
        return { success: true, message: "Invoice sent successfully!" };
    } catch (error) {
        console.error("Error sending invoice:", error);
        return { success: false, message: "Failed to send invoice", error };
    }
};

const sendSalesOverviewEmail = async (order) => {
    try {
        // Email content (HTML)
        const emailContent = `
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f7f9;
            padding: 20px;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: auto;
            background: #fff;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 3px solid #eee;
        }
        .header img {
            max-width: 120px;
        }
        h2 {
            text-align: center;
            color: #333;
            margin-top: 15px;
        }
        p {
            font-size: 14px;
            color: #555;
            line-height: 1.6;
        }
        .details {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 6px;
            margin-top: 15px;
        }
        ul {
            list-style-type: none;
            padding: 0;
        }
        ul li {
            padding: 5px 0;
        }
        .table-container {
            margin-top: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 14px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }
        th {
            background-color: #f4f4f4;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 13px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://inventory-frontend-indol.vercel.app/assets/logo.jpg" alt="Company Logo">
            <h2>Invoice</h2>
        </div>

        <div class="details">
                 <p><strong>Company Name:</strong>Thailiwale</p>
                <p><strong>Address:</strong>201/1/4, SR Compound, Dewas Naka, Lasudia Mori, Indore, Madhya Pradesh 452016</p>
                <p><strong>Email:</strong> info@thailiwale.com</p>
                <p><strong>Phone:</strong> +91 7999857050</p>
        </div>

        <div class="table-container">
            <h3>Order Details:</h3>
            <table>
                <tr>
                    <th>Order ID</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Fabric Quality</th>
                </tr>
                <tr>
                    <td>${order.orderId}</td>
                    <td>${order.orderPrice}</td>
                    <td>${order.quantity}</td>
                    <td>${order.status}</td>
                    <td>${order.fabricQuality}</td>
                </tr>
            </table>
        </div>

        <div class="table-container">
            <h3>Bag Details:</h3>
            <table>
                <tr>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Color</th>
                    <th>Handle Color</th>
                    <th>Print Color</th>
                    <th>GSM</th>
                </tr>
                <tr>
                    <td>${order.bagDetails.type}</td>
                    <td>${order.bagDetails.size}</td>
                    <td>${order.bagDetails.color}</td>
                    <td>${order.bagDetails.handleColor}</td>
                    <td>${order.bagDetails.printColor}</td>
                    <td>${order.bagDetails.gsm}</td>
                </tr>
            </table>
        </div>

        <p class="footer">Thank you for your business! <br> For inquiries, contact us at support@yourcompany.com</p>
    </div>
</body>
</html>
`;


        // Setup Nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "47974993873f54",
                pass: "1fdcda65438582"
            }
        });

        // Email options
        const mailOptions = {
            from: '"Techize Builder" <info@techizebuilder.com>',
            to: order.email,
            subject: 'Your Sales Overview',
            html: emailContent
        };

        // Send email
        await transporter.sendMail(mailOptions);
        return { success: true, message: "Sales Overview sent successfully!" };
    } catch (error) {
        console.error("Error sending sales overview email:", error);
        throw error;
    }
}
const sendCompletedEmail = async (delivery, salesRecord) => {

    console.log('delivery details is---', delivery)
    try {
        // 1️⃣ Validate Input Data
        if (!delivery || !salesRecord) {
            throw new Error("Missing delivery or sales record data.");
        }

        // 2️⃣ Email Content
        const emailContent = `
        <html>
        <head>
            <style>
                body {
            font-family: Arial, sans-serif;
            background-color: #f4f7f9;
            padding: 20px;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: auto;
            background: #fff;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 3px solid #eee;
        }
        .header img {
            max-width: 120px;
        }
        h2 {
            text-align: center;
            color: #333;
            margin-top: 15px;
        }
        p {
            font-size: 14px;
            color: #555;
            line-height: 1.6;
        }
        .details {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 6px;
            margin-top: 15px;
        }
        ul {
            list-style-type: none;
            padding: 0;
        }
        ul li {
            padding: 5px 0;
        }
        .table-container {
            margin-top: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 14px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }
        th {
            background-color: #f4f4f4;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 13px;
            color: #666;
        }
            </style>
            Offset
        </head>
        <body>
        <div class="container">
            <div class="header">
                <img src="https://inventory-frontend-indol.vercel.app/assets/logo.jpg" alt="Company Logo">
                <h2>Oder & Delivery Overview</h2>
            </div>

            <div class="details">
                 <p><strong>Company Name:</strong>Thailiwale</p>
                <p><strong>Address:</strong>201/1/4, SR Compound, Dewas Naka, Lasudia Mori, Indore, Madhya Pradesh 452016</p>
                <p><strong>Email:</strong> info@thailiwale.com</p>
                <p><strong>Phone:</strong> +91 7999857050</p>
            </div>

            <div class="table-container">
                <h3>Order Details:</h3>
                <table>
                    <tr>
                        <th>Order ID</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Status</th>
                    </tr>
                    <tr>
                        <td>${salesRecord.orderId}</td>
                        <td>${salesRecord.orderPrice}</td>
                        <td>${salesRecord.quantity}</td>
                        <td>${salesRecord.status}</td>
                    </tr>
                </table>
            </div>

            <div class="table-container">
                <h3>Bag Details:</h3>
                <table>
                    <tr>
                        <th>Type</th>
                        <th>Size</th>
                        <th>Color</th>
                        <th>Handle Color</th>
                        <th>Print Color</th>
                        <th>GSM</th>
                    </tr>
                    <tr>
                        <td>${salesRecord.bagDetails?.type || "N/A"}</td>
                        <td>${salesRecord.bagDetails?.size || "N/A"}</td>
                        <td>${salesRecord.bagDetails?.color || "N/A"}</td>
                        <td>${salesRecord.bagDetails?.handleColor || "N/A"}</td>
                        <td>${salesRecord.bagDetails?.printColor || "N/A"}</td>
                        <td>${salesRecord.bagDetails?.gsm || "N/A"}</td>
                    </tr>
                </table>
            </div>

           <div class="table-container">
                <h3>Delivery Details:</h3>
                <table>
                    <tr>
                        <th>Delivery ID</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Driver Name</th>
                        <th>Driver Contact</th>
                        <th>Vehicle No</th>
                    </tr>
                    <tr>
                        <td>${delivery._id || "N/A"}</td>
                        <td>${delivery.status || "N/A"}</td>
                        <td>${delivery.deliveryDate ? new Date(delivery.deliveryDate).toLocaleString("en-GB", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit"
        }) : "N/A"}</td>
                        <td>${delivery.driverName || "N/A"}</td>
                        <td>${delivery.driverContact || "N/A"}</td>
                        <td>${delivery.vehicleNo || "N/A"}</td>
                    </tr>
                </table>
            </div>


            <p class="footer">Thank you for your business! <br> For inquiries, contact us at support@yourcompany.com</p>
        </div>
    </body>
        </html>
        `;

        // 3️⃣ Setup Nodemailer Transporter
        const transporter = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "47974993873f54",
                pass: "1fdcda65438582"
            }
        });

        // 4️⃣ Send Email
        const mailOptions = {
            from: 'Techize Builder <info@techizebuilder.com>',
            to: salesRecord.email,
            subject: 'Your Order is Completed!',
            html: emailContent
        };

        await transporter.sendMail(mailOptions);

        console.log("✅ Invoice Email Sent Successfully");
        return { success: true, message: "Email sent successfully!" };
    } catch (error) {
        console.error("⚠️ Failed to send invoice email:", error);
        throw error;
    }
};

module.exports = { sendInvoiceEmail, sendSalesOverviewEmail, sendCompletedEmail };
