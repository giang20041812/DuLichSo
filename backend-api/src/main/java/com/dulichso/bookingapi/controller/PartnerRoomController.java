package com.dulichso.bookingapi.controller;
import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.*;
import com.dulichso.bookingapi.dto.partner.PartnerHomestayDtos.OptionDto;
import com.dulichso.bookingapi.service.PartnerChangeService;
import com.dulichso.bookingapi.service.PartnerRoomService;
import com.dulichso.bookingapi.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController @RequiredArgsConstructor @RequestMapping("/api/v1/partner/homestays/{placeId}/rooms")
public class PartnerRoomController {
    private final PartnerRoomService service;
    /** Ghi thay đổi loại phòng/giá: Homestay đang công khai thì gửi yêu cầu chờ Admin duyệt (202) thay vì ghi trực tiếp. */
    private final PartnerChangeService changes;
    @GetMapping public List<RoomDto> list(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId) {return service.list(p,placeId);}
    @GetMapping("/options") public List<OptionDto> options(@AuthenticationPrincipal UserPrincipal p) {return service.options(p);}
    @PostMapping public ResponseEntity<Object> create(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId,@Valid @RequestBody RoomInput input) {return respond(changes.saveRoom(p,placeId,null,input));}
    @PutMapping("/{id}") public ResponseEntity<Object> update(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId,@PathVariable Long id,@Valid @RequestBody RoomInput input) {return respond(changes.saveRoom(p,placeId,id,input));}
    @GetMapping("/{id}/prices") public List<PriceDto> prices(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId,@PathVariable Long id) {return service.prices(p,placeId,id);}
    @PostMapping("/{id}/prices") public ResponseEntity<Object> price(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId,@PathVariable Long id,@Valid @RequestBody PriceInput input) {return respond(changes.savePrice(p,placeId,id,null,input));}
    @PutMapping("/{id}/prices/{priceId}") public ResponseEntity<Object> price(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId,@PathVariable Long id,@PathVariable Long priceId,@Valid @RequestBody PriceInput input) {return respond(changes.savePrice(p,placeId,id,priceId,input));}
    @DeleteMapping("/{id}/prices/{priceId}") public ResponseEntity<Object> removePrice(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId,@PathVariable Long id,@PathVariable Long priceId) {
        var pending=changes.deletePrice(p,placeId,id,priceId);
        return pending==null?ResponseEntity.ok().build():ResponseEntity.accepted().body(pending);
    }
    @GetMapping("/{id}/calendar") public List<InventoryDto> calendar(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId,@PathVariable Long id,@RequestParam LocalDate startDate,@RequestParam LocalDate endDate) {return service.calendar(p,placeId,id,startDate,endDate);}
    @PutMapping("/{id}/calendar") public void inventory(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId,@PathVariable Long id,@Valid @RequestBody InventoryInput input) {service.inventory(p,placeId,id,input);}
    @GetMapping("/{id}/quote") public QuoteDto quote(@AuthenticationPrincipal UserPrincipal p,@PathVariable Long placeId,@PathVariable Long id,@RequestParam LocalDate startDate,@RequestParam LocalDate endDate,@RequestParam int roomCount,@RequestParam int guestCount) {return service.quote(p,placeId,id,startDate,endDate,roomCount,guestCount);}
    private static <T> ResponseEntity<Object> respond(PartnerChangeService.Outcome<T> outcome) {
        return outcome.isPending()?ResponseEntity.accepted().body(outcome.pending()):ResponseEntity.ok(outcome.saved());
    }
}
