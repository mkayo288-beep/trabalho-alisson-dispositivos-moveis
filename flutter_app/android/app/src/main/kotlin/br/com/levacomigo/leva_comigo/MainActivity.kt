package br.com.levacomigo.leva_comigo

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import android.app.Activity
import android.content.Intent

class MainActivity : FlutterActivity() {
    private var pending: MethodChannel.Result? = null
    private var document: String? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "br.com.levacomigo/export")
            .setMethodCallHandler { call, result ->
                if (call.method != "saveJson") {
                    result.notImplemented()
                } else if (pending != null) {
                    result.error("busy", "Aguarde a exportação atual.", null)
                } else {
                    pending = result
                    document = call.argument<String>("content")
                    try {
                        val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                            addCategory(Intent.CATEGORY_OPENABLE)
                            type = "application/json"
                            putExtra(Intent.EXTRA_TITLE, call.argument<String>("name"))
                        }
                        startActivityForResult(intent, 4719)
                    } catch (error: Exception) {
                        pending = null
                        document = null
                        result.error("export", "Não foi possível abrir o seletor de arquivos.", null)
                    }
                }
            }
    }

    @Deprecated("Android activity result bridge")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != 4719) return
        val reply = pending ?: return
        try {
            if (resultCode == Activity.RESULT_OK && data?.data != null) {
                val stream = contentResolver.openOutputStream(data.data!!)
                    ?: throw IllegalStateException("Arquivo indisponível")
                stream.use { it.write((document ?: "").toByteArray(Charsets.UTF_8)) }
            }
            reply.success(null)
        } catch (error: Exception) {
            reply.error("export", "Não foi possível salvar o arquivo. Tente outro local.", null)
        } finally {
            pending = null
            document = null
        }
    }
}
