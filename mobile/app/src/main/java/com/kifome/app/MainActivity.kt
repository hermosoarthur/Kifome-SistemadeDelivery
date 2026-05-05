package com.kifome.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.kifome.app.core.datastore.UserPreferences
import com.kifome.app.navigation.KifomeNavGraph
import com.kifome.app.ui.theme.KifomeTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    @Inject
    lateinit var userPreferences: UserPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            KifomeTheme {
                KifomeNavGraph(userPreferences)
            }
        }
    }
}
