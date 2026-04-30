import 'package:flutter/material.dart';

import 'screens/shop.dart';

void main() => runApp(const CommerceApp());

class CommerceApp extends StatelessWidget {
  const CommerceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Commerce Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0F766E),
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: const Color(0xFFF3F6F8),
        useMaterial3: true,
      ),
      home: const ShopScreen(),
    );
  }
}
