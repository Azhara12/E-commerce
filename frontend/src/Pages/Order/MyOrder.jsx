import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { useAlert } from 'react-alert';
import { MdRocketLaunch } from "react-icons/md";
import { DataGrid } from '@mui/x-data-grid';
import Typography from "@mui/material/Typography";
import { clearError, getMyOrder } from '../../actions/orderAction';
import Loader from '../../Components/Loader/Loader'; // Agar loader file mojud ho
import './MyOrder.css';

const MyOrder = () => {
  const alert = useAlert();
  const dispatch = useDispatch();
  const { loading, orders, error } = useSelector((state) => state.myOrders);
  const { user } = useSelector((state) => state.user);

  const columns = [
    { field: "id", headerName: "Order ID", minWidth: 300, flex: 1 },
    {
      field: "status",
      headerName: "Status",
      minWidth: 150,
      flex: 0.5,
      cellClassName: (params) => {
        return params.value === "Delivered" ? "greenColor" : "redColor";
      },
    },
    { 
      field: "itemQty", 
      headerName: "Item Qty", 
      minWidth: 150, 
      type: "number", 
      flex: 0.3 
    },
    { 
      field: "amount", 
      headerName: "Amount", 
      minWidth: 270, 
      type: "number", 
      flex: 0.5 
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 50, 
      type: "number",
      flex: 0.4, 
      sortable: false,
      renderCell: (params) => {
        return (
          <Link to={`/order/${params.row.id}`}>
            <MdRocketLaunch />
          </Link>
        );
      },
    },
  ];

  const rows = [];

  // Safe fallback to prevent undefined crashing
  orders &&
    orders.forEach((item) => {
      // Handles both orderItems and OrderItems safely
      const itemsList = item.orderItems || item.OrderItems || [];
      
      rows.push({
        id: item._id,
        itemQty: itemsList.length,
        status: item.orderStatus,
        amount: item.totalPrice,
      });
    });

  useEffect(() => {
    if (error) {
      alert.error(error);
      dispatch(clearError());
    }
    dispatch(getMyOrder());
  }, [dispatch, alert, error]);

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div className="my-order-page">
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={10}
            disableSelectionOnClick
            className="my-order-table"
            autoHeight
          />
          <Typography id="my-order-heading">
            {user?.name ? `${user.name}'s Orders` : "My Orders"}
          </Typography>
        </div>
      )}
    </>
  );
};

export default MyOrder;