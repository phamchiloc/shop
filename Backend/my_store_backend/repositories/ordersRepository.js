import db from '../db.js';

export const getAllOrders = async () => {
  const [orders] = await db.query('SELECT * FROM orders');
  
  // Lấy order_details cho từng order
  for (let order of orders) {
    const [details] = await db.query(`
      SELECT od.id as order_detail_id, od.quantity, od.price,
             ps.id as product_size_id, s.size as size_name,
             p.id as product_id, p.name as product_name, p.price as product_price, p.image
      FROM order_details od
      LEFT JOIN product_sizes ps ON od.product_sizes_id = ps.id
      LEFT JOIN sizes s ON ps.size_id = s.id
      LEFT JOIN product p ON ps.product_id = p.id
      WHERE od.order_id = ?
    `, [order.id]);
    
    order.order_details = details;
  }
  
  return orders;
};

export const getOrderById = async (id) => {
  const [orders] = await db.query('SELECT * FROM orders WHERE id=?', [id]);
  if (!orders[0]) return null;

  const [details] = await db.query(`
    SELECT od.id as order_detail_id, od.quantity, od.price,
           ps.id as product_size_id, s.size as size_name,
           p.id as product_id, p.name as product_name, p.price as product_price, p.image
    FROM order_details od
    LEFT JOIN product_sizes ps ON od.product_sizes_id = ps.id
    LEFT JOIN sizes s ON ps.size_id = s.id
    LEFT JOIN product p ON ps.product_id = p.id
    WHERE od.order_id = ?
  `, [id]);

  return { ...orders[0], order_details: details };
};

export const createOrder = async (orderData) => {
  const { name, phone, address, account_id, total_amount, payment_method, is_paid, order_details } = orderData;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO orders (name, phone, address, account_id, total_amount, payment_method, is_paid) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, phone, address, account_id || null, total_amount || 0, payment_method || 'cod', is_paid ? 1 : 0]
    );

    const orderId = result.insertId;

    if (order_details && order_details.length > 0) {
      // Kiểm tra và giảm stock cho từng sản phẩm
      for (const detail of order_details) {
        const { product_sizes_id, quantity } = detail;
        
        // Lấy stock hiện tại
        const [stockRows] = await conn.query(
          'SELECT stock FROM product_sizes WHERE id = ?',
          [product_sizes_id]
        );
        
        if (!stockRows[0]) {
          throw new Error(`Product size ID ${product_sizes_id} không tồn tại`);
        }
        
        const currentStock = stockRows[0].stock;
        
        if (currentStock < quantity) {
          throw new Error(`Không đủ hàng trong kho. Còn lại: ${currentStock}, yêu cầu: ${quantity}`);
        }
        
        // Giảm stock
        await conn.query(
          'UPDATE product_sizes SET stock = stock - ? WHERE id = ?',
          [quantity, product_sizes_id]
        );
      }
      
      // Insert order details
      const values = order_details.map(d => [orderId, d.product_sizes_id, d.quantity, d.price]);
      await conn.query('INSERT INTO order_details (order_id, product_sizes_id, quantity, price) VALUES ?', [values]);
    }

    await conn.commit();
    return orderId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateOrderStatus = async (id, data) => {
  const { status, is_paid, payment_method, payment_info } = data;
  
  // Xây dựng câu query động dựa trên các trường có trong data
  const updateFields = [];
  const updateValues = [];
  
  if (status !== undefined) {
    updateFields.push('status = ?');
    updateValues.push(status);
  }
  
  if (is_paid !== undefined) {
    updateFields.push('is_paid = ?');
    updateValues.push(is_paid ? 1 : 0);
  }
  
  if (payment_method !== undefined) {
    updateFields.push('payment_method = ?');
    updateValues.push(payment_method);
  }
  
  if (payment_info !== undefined) {
    updateFields.push('payment_info = ?');
    updateValues.push(payment_info);
  }
  
  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }
  
  updateValues.push(id); // Thêm id vào cuối cho WHERE clause
  
  const query = `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`;
  await db.query(query, updateValues);
};

export const deleteOrder = async (id) => {
  await db.query('DELETE FROM orders WHERE id=?', [id]);
};
