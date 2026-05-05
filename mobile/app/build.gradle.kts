plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt.android)
}

android {
    namespace = "com.kifome.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.kifome.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
        manifestPlaceholders["MAPS_API_KEY"] = (project.findProperty("MAPS_API_KEY") as String?)
            ?: (project.findProperty("GOOGLE_MAPS_KEY") as String?)
            ?: ""

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        debug {
            // Use production API for debug — local emulator requires extra config
            buildConfigField("String", "API_BASE_URL", "\"https://kifome-backend.onrender.com/\"")
            buildConfigField("String", "MAPS_API_KEY", "\"${project.findProperty("MAPS_API_KEY") ?: project.findProperty("GOOGLE_MAPS_KEY") ?: ""}\"")
            buildConfigField("String", "EMAILJS_SERVICE_ID", "\"${project.findProperty("EMAILJS_SERVICE_ID") ?: ""}\"")
            buildConfigField("String", "EMAILJS_TEMPLATE_ID", "\"${project.findProperty("EMAILJS_TEMPLATE_ID") ?: ""}\"")
            buildConfigField("String", "EMAILJS_PUBLIC_KEY", "\"${project.findProperty("EMAILJS_PUBLIC_KEY") ?: ""}\"")
        }
        release {
            isMinifyEnabled = false
            buildConfigField("String", "API_BASE_URL", "\"https://kifome-backend.onrender.com/\"")
            buildConfigField("String", "MAPS_API_KEY", "\"${project.findProperty("MAPS_API_KEY") ?: project.findProperty("GOOGLE_MAPS_KEY") ?: ""}\"")
            buildConfigField("String", "EMAILJS_SERVICE_ID", "\"${project.findProperty("EMAILJS_SERVICE_ID") ?: ""}\"")
            buildConfigField("String", "EMAILJS_TEMPLATE_ID", "\"${project.findProperty("EMAILJS_TEMPLATE_ID") ?: ""}\"")
            buildConfigField("String", "EMAILJS_PUBLIC_KEY", "\"${project.findProperty("EMAILJS_PUBLIC_KEY") ?: ""}\"")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    val composeBom = platform(libs.androidx.compose.bom)
    implementation(composeBom)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)

    // Core
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)

    // Navigation
    implementation(libs.androidx.navigation.compose)

    // Hilt
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.androidx.hilt.navigation.compose)

    // Retrofit + OkHttp
    implementation(libs.retrofit)
    implementation(libs.retrofit.gson)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)

    // DataStore
    implementation(libs.androidx.datastore.preferences)

    // Coil
    implementation(libs.coil.compose)

    // Coroutines
    implementation(libs.kotlinx.coroutines.android)

    // Google Maps
    implementation(libs.play.services.maps)
    implementation(libs.maps.compose)
    implementation(libs.google.places)
    implementation(libs.play.services.auth)

    // Accompanist
    implementation(libs.accompanist.systemuicontroller)
    implementation(libs.accompanist.swiperefresh)

    // Browser (Chrome Custom Tabs for Mercado Pago)
    implementation(libs.androidx.browser)

    // WorkManager (notification polling)
    implementation(libs.androidx.work.runtime)

    // Tests
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(composeBom)
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
}
