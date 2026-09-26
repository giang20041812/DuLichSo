package com.dulichso.bookingapi.controller;
import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.*;
import com.dulichso.bookingapi.dto.partner.PartnerHomestayDtos.OptionDto;
import com.dulichso.bookingapi.service.PartnerRoomService;
import com.dulichso.bookingapi.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController @RequiredArgsConstructor @RequestMapping("/api/v1/partner/homestays/{placeId}/rooms")
public class PartnerRoomController {
    private final PartnerRoomService service;
    @GetMapping public List<RoomDto> list(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId) {return service.list(p,placeId);}
    @GetMapping("/options") public List<OptionDto> options(@AuthenticationPrincipal UserPrincipal p) {return service.options(p);}
    @PostMapping public RoomDto create(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId,@Valid @RequestBody RoomInput input) {return service.save(p,placeId,null,input);}
    @PutMapping("/{id}") public RoomDto update(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId,@PathVariable Long id,@Valid @RequestBody RoomInput input) {return service.save(p,placeId,id,input);}
    @GetMapping("/{id}/prices") public List<PriceDto> prices(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId,@PathVariable Long id) {return service.prices(p,placeId,id);}
    @PostMapping("/{id}/prices") public PriceDto price(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId,@PathVariable Long id,@Valid @RequestBody PriceInput input) {return service.savePrice(p,placeId,id,null,input);}
    @PutMapping("/{id}/prices/{priceId}") public PriceDto price(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId,@PathVariable Long id,@PathVariable Long priceId,@Valid @RequestBody PriceInput input) {return service.savePrice(p,placeId,id,priceId,input);}
    @DeleteMapping("/{id}/prices/{priceId}") public void removePrice(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId,@PathVariable Long id,@PathVariable Long priceId) {service.deletePrice(p,placeId,id,priceId);}
    @GetMapping("/{id}/calendar") public List<InventoryDto> calendar(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId,@PathVariable Long id,@RequestParam LocalDate startDate,@RequestParam LocalDate endDate) {return service.calendar(p,placeId,id,startDate,endDate);}
    @PutMapping("/{id}/calendar") public void inventory(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId,@PathVariable Long id,@Valid @RequestBody InventoryInput input) {service.inventory(p,placeId,id,input);}
    @GetMapping("/{id}/quote") public QuoteDto quote(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId,@PathVariable Long id,@RequestParam LocalDate startDate,@RequestParam LocalDate endDate,@RequestParam int roomCount,@RequestParam int guestCount) {return service.quote(p,placeId,id,startDate,endDate,roomCount,guestCount);}
}
