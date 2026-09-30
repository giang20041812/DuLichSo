package com.dulichso.bookingapi.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class GeocodingServiceTest {
    private GeocodingService service;
    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        service = new GeocodingService();
        ReflectionTestUtils.setField(service, "endpoint", "https://maps.vietmap.vn/api/search/v3");
        ReflectionTestUtils.setField(service, "placeEndpoint", "https://maps.vietmap.vn/api/place/v3");
        ReflectionTestUtils.setField(service, "apiKey", "test-key");
        RestTemplate client = (RestTemplate) ReflectionTestUtils.getField(service, "restTemplate");
        server = MockRestServiceServer.createServer(client);
    }

    @Test
    void resolvesSearchReferenceThroughPlaceAndCachesCoordinates() {
        server.expect(requestTo("https://maps.vietmap.vn/api/search/v3?apikey=test-key&text=Khau%20Pha"))
                .andRespond(withSuccess("[{\"ref_id\":\":POI:420676\",\"display\":\"Khau Pha\"}]", MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://maps.vietmap.vn/api/place/v3?apikey=test-key&refid=:POI:420676"))
                .andRespond(withSuccess("{\"lat\":21.7,\"lng\":104.2}", MediaType.APPLICATION_JSON));

        var result = service.geocode("Khau Pha").orElseThrow();
        assertEquals(21.7, result.latitude());
        assertEquals(104.2, result.longitude());
        assertEquals("Khau Pha", result.displayName());
        assertEquals(result, service.geocode("Khau Pha").orElseThrow());
        server.verify();
    }

    @Test
    void emptySearchIsNotFound() {
        server.expect(anything()).andRespond(withSuccess("[]", MediaType.APPLICATION_JSON));
        assertTrue(service.geocode("Khau Pha").isEmpty());
        server.verify();
    }

    @Test
    void missingKeyIsServiceUnavailable() {
        ReflectionTestUtils.setField(service, "apiKey", "");
        var error = assertThrows(ResponseStatusException.class, () -> service.geocode("Khau Pha"));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.getStatusCode());
        server.verify();
    }

    @Test
    void invalidPlaceCoordinatesAreNotReportedAsAddressNotFound() {
        server.expect(anything()).andRespond(withSuccess("[{\"ref_id\":\"place-id\"}]", MediaType.APPLICATION_JSON));
        server.expect(anything()).andRespond(withSuccess("{\"lat\":null,\"lng\":104.2}", MediaType.APPLICATION_JSON));
        var error = assertThrows(ResponseStatusException.class, () -> service.geocode("Khau Pha"));
        assertEquals(HttpStatus.BAD_GATEWAY, error.getStatusCode());
        server.verify();
    }
}
