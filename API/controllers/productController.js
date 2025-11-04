const Products = require('../models/productModel');


exports.createProduct = async (req, res) => {
  try {
    const result = await Products.create(req.body,req.userDetails);
    res.status(201).json({ message: 'Product created', id: result.insertId });
  } catch (err) {
    console.error('Error creating Product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const results = await Products.getAll();
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching Products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateProduct = async (req, res) => {
  const id = req.params.id;
  try {
    await Products.update(id, req.body,req.userDetails);
    res.status(200).json({ message: 'Product updated' });
  } catch (err) {
    console.error('Error updating Product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteProduct = async (req, res) => {
  const id = req.params.id;
  try {
    await Products.delete(id,req.userDetails);
    res.status(200).json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Error deleting Product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
