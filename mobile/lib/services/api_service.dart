import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/cart_item.dart';
import '../models/product.dart';

const apiBaseUrl = 'http://10.0.2.2:3000';

class ApiService {
  const ApiService({http.Client? client}) : _client = client;

  final http.Client? _client;

  http.Client get client => _client ?? http.Client();

  Future<List<Product>> getProducts({String search = ''}) async {
    final uri = Uri.parse('$apiBaseUrl/products').replace(
      queryParameters: search.isEmpty ? null : {'search': search},
    );
    final response = await client.get(uri);
    final body = _decode(response);

    return (body['data'] as List)
        .map((item) => Product.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<Map<String, dynamic>> createPaymentIntent(List<CartItem> items) async {
    final response = await client.post(
      Uri.parse('$apiBaseUrl/payments/intent'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'items': _serializeItems(items)}),
    );

    return _decode(response)['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createOrder({
    required List<CartItem> items,
    required String name,
    required String email,
    required String address,
    required String paymentIntentId,
  }) async {
    final response = await client.post(
      Uri.parse('$apiBaseUrl/orders'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'items': _serializeItems(items),
        'paymentIntentId': paymentIntentId,
        'customer': {
          'name': name,
          'email': email,
          'address': address,
        },
      }),
    );

    return _decode(response)['data'] as Map<String, dynamic>;
  }

  List<Map<String, dynamic>> _serializeItems(List<CartItem> items) {
    return items
        .map(
          (item) => {
            'productId': item.product.id,
            'quantity': item.quantity,
          },
        )
        .toList();
  }

  Map<String, dynamic> _decode(http.Response response) {
    final body = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 400) {
      throw ApiException(body['error']?.toString() ?? 'Request failed.');
    }

    return body;
  }
}

class ApiException implements Exception {
  const ApiException(this.message);

  final String message;

  @override
  String toString() => message;
}
