class Product {
  const Product({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.rating,
    required this.stock,
    required this.image,
    required this.description,
  });

  final String id;
  final String name;
  final String category;
  final double price;
  final double rating;
  final int stock;
  final String image;
  final String description;

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] as String,
      name: json['name'] as String,
      category: json['category'] as String,
      price: (json['price'] as num).toDouble(),
      rating: (json['rating'] as num).toDouble(),
      stock: json['stock'] as int,
      image: json['image'] as String,
      description: json['description'] as String,
    );
  }
}
