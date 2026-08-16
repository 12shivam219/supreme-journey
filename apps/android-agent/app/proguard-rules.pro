# Keep Room entities and DAOs
-keep class androidx.room.** { *; }
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.paging.**

# Keep Data Transfer Objects & Retrofit models
-keepclassmembers class com.tracker.agent.data.remote.** { *; }
-keepclassmembers class com.tracker.agent.data.local.** { *; }

# Keep ZXing QR Scanner
-keep class com.google.zxing.** { *; }
-keep class com.journeyapps.barcodescanner.** { *; }
-dontwarn com.google.zxing.**

# Keep WorkManager Worker classes
-keep class * extends androidx.work.ListenableWorker {
    public <init>(android.content.Context, androidx.work.WorkerParameters);
}
