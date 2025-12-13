import 'package:flutter/material.dart';
import 'package:gestion_presence_etudiant/screens/auth/login_screen.dart';
import 'package:provider/provider.dart';
import '../models/master_model.dart';
import '../services/master_service.dart';
import '../providers/auth_provider.dart';

class SelectMasterScreen extends StatefulWidget {
  const SelectMasterScreen({Key? key}) : super(key: key);

  @override
  State<SelectMasterScreen> createState() => _SelectMasterScreenState();
}

class _SelectMasterScreenState extends State<SelectMasterScreen> {
  final MasterService _masterService = MasterService();
  List<Master> _masters = [];
  bool _isLoading = true;
  String? _errorMessage;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadMasters();
  }

  Future<void> _loadMasters() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final response = await _masterService.getAllMasters();

    setState(() {
      _isLoading = false;
      if (response.success && response.data != null) {
        _masters = response.data!;
      } else {
        _errorMessage = response.error ?? 'Erreur de chargement';
      }
    });
  }

  Future<void> _selectMasterWithInscription(Master master) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final etudiantId = authProvider.pendingEtudiantId;

    if (etudiantId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Erreur: ID étudiant manquant'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    // ✅ Créer l'inscription
    final response = await _masterService.createInscription(
      etudiantId: etudiantId,
      masterId: master.masterId,
    );

    setState(() {
      _isSubmitting = false;
    });

    if (!mounted) return;

    if (response.success) {
      authProvider.clearPendingEtudiantId();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Inscription au ${master.nom} réussie !'),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 2),
        ),
      );

      await Future.delayed(const Duration(seconds: 2));

      if (mounted) {
        // ✅ REDIRECTION VERS LOGIN
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => const LoginScreen(),  // ← Pas besoin de passer l'ID !
          ),
        );
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response.error ?? 'Erreur d\'inscription'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Choisir votre Master'),
        automaticallyImplyLeading: false,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.error_outline,
                        color: Colors.red,
                        size: 48,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _errorMessage!,
                        style: const TextStyle(
                          color: Colors.red,
                          fontSize: 16,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: _loadMasters,
                        icon: const Icon(Icons.refresh),
                        label: const Text('Réessayer'),
                      ),
                    ],
                  ),
                )
              : _masters.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.school_outlined,
                            size: 64,
                            color: Colors.grey,
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Aucun master disponible',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    )
                  : Column(
                      children: [
                        // En-tête informatif
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          color: Colors.blue.shade50,
                          child: const Text(
                            'Sélectionnez votre master pour continuer',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                        
                        // Liste des masters
                        Expanded(
                          child: ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _masters.length,
                            itemBuilder: (context, index) {
                              final master = _masters[index];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                elevation: 2,
                                child: ListTile(
                                  contentPadding: const EdgeInsets.all(16),
                                  leading: CircleAvatar(
                                    backgroundColor: Colors.blue,
                                    child: Text(
                                      master.code.substring(0, 2).toUpperCase(),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  title: Text(
                                    master.nom,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                  subtitle: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          const Icon(
                                            Icons.code,
                                            size: 16,
                                            color: Colors.grey,
                                          ),
                                          const SizedBox(width: 4),
                                          Text('Code: ${master.code}'),
                                        ],
                                      ),
                                      if (master.anneeUniversitaire != null)
                                        Row(
                                          children: [
                                            const Icon(
                                              Icons.calendar_today,
                                              size: 16,
                                              color: Colors.grey,
                                            ),
                                            const SizedBox(width: 4),
                                            Text('Année: ${master.anneeUniversitaire}'),
                                          ],
                                        ),
                                    ],
                                  ),
                                  trailing: _isSubmitting
                                      ? const SizedBox(
                                          width: 24,
                                          height: 24,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                          ),
                                        )
                                      : const Icon(
                                          Icons.arrow_forward_ios,
                                          color: Colors.blue,
                                        ),
                                  onTap: _isSubmitting
                                      ? null
                                      : () {
                                          
                                          _selectMasterWithInscription(master);
                                          
                                          
                                        },
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
    );
  }
}