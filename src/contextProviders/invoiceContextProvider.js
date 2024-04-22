import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const InvoiceDataContext = createContext();

const InvoiceDataProvider = ({ children }) => {
  const initialState = {
    companyInfo: {
      from: {
        name: "CRESCOSA PTY LTD",
        address: "7 Langa Crescent",
        city: "Emalahleni",
        postalCode: 1035,
        vatNumber: "4050305079",
      },
      to: {
        name: "COALCOR (PTY) LTD",
        address: "Goalcor",
        city: "Newcastle",
        postalCode: 2940,
        vatNumber: "4050305079",
      },
    },
    invoiceDetails: {
      refNumber: "IN00000120",
      date: "2023-03-01", // Use new Date object
      dueDate: "2023-11-31",
      orderNumber: "",
    },
    tableItems: [
      {
        description: "Salaries",
        quantity: 2000,
        price: 16000,
        discount: 0,
        vat: {
          percentage: 15,
        },
      },
    ],
    paymentInfo: {
      bank: "FNB Bank",
      accountName: "Crescosa Group (PTY) Ltd",
      accountNumber: 62914015195,
      branchCode: 251742,
      branch: "Lakeside Mall",
    },
  };

  const [invoiceData, setInvoiceData] = useState(initialState);

  useEffect(() => {
    const fetchFirstInvoice = async () => {
      try {
        const response = await axios.get("http://localhost:3000/invoices");

        const firstInvoice = response.data[response.data.length - 1];

        if (firstInvoice) {
          setInvoiceData(firstInvoice);
        } else {
          // Handle case where no invoice is returned
          console.error("No invoice found.");
        }
      } catch (error) {
        // Handle fetch error
        console.error("Error fetching invoice:", error);
      }
    };

    fetchFirstInvoice();
  }, []); // Empty dependency array to run the effect only once on component mount

  return (
    <InvoiceDataContext.Provider value={{ invoiceData, setInvoiceData }}>
      {children}
    </InvoiceDataContext.Provider>
  );
};

export default InvoiceDataProvider;
