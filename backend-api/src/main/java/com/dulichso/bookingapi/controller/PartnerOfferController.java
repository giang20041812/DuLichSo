package com.dulichso.bookingapi.controller;
import com.dulichso.bookingapi.dto.partner.HomestayServiceDtos.*;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.HomestayOfferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequiredArgsConstructor @RequestMapping("/api/v1/partner/homestays/{placeId}/services")
public class PartnerOfferController {
    private final HomestayOfferService service;
    @GetMapping public List<ServiceDto> list(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId) {return service.list(p,placeId);}
    @PostMapping public ServiceDto create(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId,@Valid @RequestBody Input input) {return service.save(p,placeId,null,input);}
    @PutMapping("/{id}") public ServiceDto update(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId,@PathVariable Long id,@Valid @RequestBody Input input) {return service.save(p,placeId,id,input);}
}
