import React, { useEffect, useRef, useState } from "react";
import "./Payment.css";
import { BsFillCreditCardFill, BsCalendarEventFill } from "react-icons/bs";
import { MdVpnKeyOff } from "react-icons/md";
import CheckOutStep from "../../Components/CheckOutStep/CheckOutStep";
import Typography from "@mui/material/Typography";
import {
  CardExpiryElement,
  CardCvcElement,
  CardNumberElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useDispatch, useSelector } from "react-redux";
import { useAlert } from "react-alert";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { clearError, createOrder } from "../../actions/orderAction";
import Small from "../../Components/smallSpiner/SmallSpiner";

const Payment = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const payBtn = useRef(null);
  const alert = useAlert();
  const stripe = useStripe();
  const elements = useElements();

  const { user } = useSelector((state) => state.user);
  const { shippingInfo, cartItems } = useSelector((state) => state.cart);
  const { error } = useSelector((state) => state.newOrder);
  const [loading, setLoading] = useState(false);

  // Parse sessionStorage safely
  const orderInfo = JSON.parse(sessionStorage.getItem("orderInfo")) || {};

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      alert.error("Stripe is still loading. Please try again in a moment.");
      return;
    }

    setLoading(true);
    if (payBtn.current) payBtn.current.disabled = true;

    try {
      const paymentData = {
        amount: Math.round(orderInfo?.Total || 0) * 100,
      };

      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      // 1. Fetch payment intent client secret
      const { data } = await axios.post(
        "/api/v1/payment/process",
        paymentData,
        config
      );

      const client_secret = data.client_secret || data.clientSecret;

      if (!client_secret) {
        throw new Error("Failed to receive payment authorization secret from backend.");
      }

      // 2. Confirm Payment with Stripe
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: {
            name: user?.name || "Customer",
            email: user?.email || "",
            address: {
              line1: shippingInfo?.address,
              city: shippingInfo?.city,
              state: shippingInfo?.state,
              postal_code: shippingInfo?.pinCode || shippingInfo?.postalCode,
              country: shippingInfo?.country,
            },
          },
        },
      });

      if (result.error) {
        if (payBtn.current) payBtn.current.disabled = false;
        alert.error(result.error.message);
      } else {
        if (result.paymentIntent.status === "succeeded") {
          // Construct Order Object inside handler to get latest state
          const orderDetails = {
            shippingInfo,
            orderItems: cartItems,
            itemsPrice: orderInfo?.subTotal,
            taxPrice: orderInfo?.tax,
            shippingPrice: orderInfo?.shippingCharges,
            totalPrice: orderInfo?.Total,
            paymentInfo: {
              id: result.paymentIntent.id,
              status: result.paymentIntent.status,
            },
          };

          // 3. Save order to MongoDB database
          await dispatch(createOrder(orderDetails));
          
          navigate("/success");
        } else {
          alert.error("Payment was not completed successfully.");
        }
      }
    } catch (err) {
      if (payBtn.current) payBtn.current.disabled = false;
      const errorMsg =
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : err.message;
      alert.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (error) {
      alert.error(error);
      dispatch(clearError());
    }
  }, [dispatch, alert, error]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <CheckOutStep activeStep={2} />
      <div className="paymentContainer">
        <form className="paymentForm" onSubmit={submitHandler}>
          <Typography>Card Info</Typography>
          <div>
            <BsFillCreditCardFill />
            <CardNumberElement className="paymentInput" />
          </div>
          <div>
            <BsCalendarEventFill />
            <CardExpiryElement className="paymentInput" />
          </div>
          <div>
            <MdVpnKeyOff />
            <CardCvcElement className="paymentInput" />
          </div>
          <button
            type="submit"
            ref={payBtn}
            className="paymentBtn"
            disabled={loading}
          >
            {loading ? (
              <Small />
            ) : (
              `Pay - ₹${orderInfo?.Total ? Math.round(orderInfo.Total) : 0}`
            )}
          </button>
        </form>
      </div>
    </>
  );
};

export default Payment;