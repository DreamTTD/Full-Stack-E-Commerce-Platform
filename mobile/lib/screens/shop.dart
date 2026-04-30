import 'package:flutter/material.dart';

import '../models/cart_item.dart';
import '../models/product.dart';
import '../services/api_service.dart';

class ShopScreen extends StatefulWidget {
  const ShopScreen({super.key});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  final _api = const ApiService();
  final _searchController = TextEditingController();
  final _nameController = TextEditingController(text: 'Avery Stone');
  final _emailController = TextEditingController(text: 'avery@example.com');
  final _addressController = TextEditingController(text: '18 Market Street, Cape Town');

  List<Product> _products = [];
  final Map<String, CartItem> _cart = {};
  bool _loading = true;
  bool _checkingOut = false;
  String? _error;

  double get _subtotal => _cart.values.fold(0.0, (sum, item) => sum + item.total);
  double get _deliveryFee => _subtotal > 500 || _subtotal == 0 ? 0 : 12;
  double get _total => _subtotal + _deliveryFee;
  int get _cartCount => _cart.values.fold(0, (sum, item) => sum + item.quantity);

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _nameController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _loadProducts([String search = '']) async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final products = await _api.getProducts(search: search);
      setState(() => _products = products);
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  void _addToCart(Product product) {
    final current = _cart[product.id];
    final quantity = (current?.quantity ?? 0) + 1;

    if (quantity > product.stock) {
      _showMessage('${product.name} is out of stock.');
      return;
    }

    setState(() {
      _cart[product.id] = CartItem(product: product, quantity: quantity);
    });
  }

  void _removeFromCart(CartItem item) {
    setState(() {
      if (item.quantity <= 1) {
        _cart.remove(item.product.id);
      } else {
        _cart[item.product.id] = item.copyWith(quantity: item.quantity - 1);
      }
    });
  }

  Future<void> _checkout() async {
    if (_cart.isEmpty) {
      _showMessage('Add an item before checkout.');
      return;
    }

    setState(() => _checkingOut = true);

    try {
      final payment = await _api.createPaymentIntent(_cart.values.toList());
      final intent = payment['paymentIntent'] as Map<String, dynamic>;
      final order = await _api.createOrder(
        items: _cart.values.toList(),
        name: _nameController.text,
        email: _emailController.text,
        address: _addressController.text,
        paymentIntentId: intent['id'] as String,
      );

      setState(_cart.clear);
      _showMessage('Order ${order['id']} paid successfully.');
      await _loadProducts(_searchController.text);
    } catch (error) {
      _showMessage(error.toString());
    } finally {
      setState(() => _checkingOut = false);
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Commerce Mobile'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Badge(
                label: Text('$_cartCount'),
                child: const Icon(Icons.shopping_bag_outlined),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => _loadProducts(_searchController.text),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _buildHeader(),
              const SizedBox(height: 16),
              _buildSearch(),
              const SizedBox(height: 20),
              if (_loading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32),
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (_error != null)
                _ErrorState(message: _error!, onRetry: () => _loadProducts(_searchController.text))
              else
                ..._products.map((product) => _ProductTile(
                      product: product,
                      onAdd: () => _addToCart(product),
                    )),
              const SizedBox(height: 20),
              _buildCart(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF172026),
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Secure checkout built for mobile buyers',
            style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800),
          ),
          SizedBox(height: 8),
          Text(
            'Fast catalog search, cart totals, and payment intent workflow.',
            style: TextStyle(color: Color(0xFFD9E4EA), height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _buildSearch() {
    return TextField(
      controller: _searchController,
      textInputAction: TextInputAction.search,
      decoration: InputDecoration(
        hintText: 'Search products',
        prefixIcon: const Icon(Icons.search),
        suffixIcon: IconButton(
          icon: const Icon(Icons.tune),
          onPressed: () => _loadProducts(_searchController.text),
        ),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        filled: true,
        fillColor: Colors.white,
      ),
      onSubmitted: _loadProducts,
    );
  }

  Widget _buildCart() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFDCE2E8)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Checkout', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          if (_cart.isEmpty)
            const Text('Your cart is empty.')
          else
            ..._cart.values.map(
              (item) => ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(item.product.name),
                subtitle: Text('${item.quantity} x \$${item.product.price.toStringAsFixed(2)}'),
                trailing: IconButton(
                  icon: const Icon(Icons.remove_circle_outline),
                  onPressed: () => _removeFromCart(item),
                ),
              ),
            ),
          const Divider(height: 28),
          _PriceRow(label: 'Subtotal', value: _subtotal),
          _PriceRow(label: 'Delivery', value: _deliveryFee),
          _PriceRow(label: 'Total', value: _total, emphasized: true),
          const SizedBox(height: 16),
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(labelText: 'Name'),
          ),
          TextField(
            controller: _emailController,
            decoration: const InputDecoration(labelText: 'Email'),
            keyboardType: TextInputType.emailAddress,
          ),
          TextField(
            controller: _addressController,
            decoration: const InputDecoration(labelText: 'Delivery address'),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _checkingOut ? null : _checkout,
              icon: _checkingOut
                  ? const SizedBox.square(
                      dimension: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.lock_outline),
              label: Text(_checkingOut ? 'Processing' : 'Pay securely'),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProductTile extends StatelessWidget {
  const _ProductTile({required this.product, required this.onAdd});

  final Product product;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: const BorderSide(color: Color(0xFFDCE2E8)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                product.image,
                width: 86,
                height: 86,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  width: 86,
                  height: 86,
                  color: const Color(0xFFE6EDF1),
                  child: const Icon(Icons.image_not_supported_outlined),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(product.name, style: const TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 4),
                  Text(
                    product.description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Color(0xFF69757F)),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 10,
                    runSpacing: 6,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Text(
                        '\$${product.price.toStringAsFixed(2)}',
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                      Text('${product.stock} left'),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star, size: 16, color: Color(0xFFB45309)),
                          Text(product.rating.toStringAsFixed(1)),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
            IconButton.filledTonal(
              tooltip: 'Add to cart',
              onPressed: onAdd,
              icon: const Icon(Icons.add_shopping_cart),
            ),
          ],
        ),
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  const _PriceRow({
    required this.label,
    required this.value,
    this.emphasized = false,
  });

  final String label;
  final double value;
  final bool emphasized;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            '\$${value.toStringAsFixed(2)}',
            style: TextStyle(
              fontWeight: emphasized ? FontWeight.w900 : FontWeight.w600,
              fontSize: emphasized ? 18 : 14,
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFDCE2E8)),
      ),
      child: Column(
        children: [
          const Icon(Icons.cloud_off_outlined, size: 42),
          const SizedBox(height: 10),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}
