package com.dulichso.bookingapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.nio.file.Files;
import java.util.List;

@SpringBootApplication
public class BookingApiApplication {

	public static void main(String[] args) {
		loadEnv();
		SpringApplication.run(BookingApiApplication.class, args);
	}

	private static void loadEnv() {
		// Look for .env in potential locations:
		// 1. Current working directory (.env)
		// 2. Subdirectory backend-api/.env (if started from project root)
		// 3. Parent directory ../backend-api/.env or ../.env
		File[] candidates = {
			new File("backend-api/.env"),
			new File(".env"),
			new File("../backend-api/.env"),
			new File("../.env")
		};

		for (File envFile : candidates) {
			if (envFile.exists() && envFile.isFile()) {
				try {
					List<String> lines = Files.readAllLines(envFile.toPath());
					for (String line : lines) {
						line = line.trim();
						if (line.isEmpty() || line.startsWith("#")) {
							continue;
						}
						int eqIdx = line.indexOf('=');
						if (eqIdx > 0) {
							String key = line.substring(0, eqIdx).trim();
							String value = line.substring(eqIdx + 1).trim();
							// Only set if not already set in System properties or environment
							if (System.getProperty(key) == null && System.getenv(key) == null) {
								System.setProperty(key, value);
							}
						}
					}
					break;
				} catch (Exception ignored) {
				}
			}
		}
	}

}
