package com.dulichso.bookingapi.controller;

import com.dulichso.bookingapi.dto.partner.PartnerMediaDtos.*;
import com.dulichso.bookingapi.security.UserPrincipal;
import com.dulichso.bookingapi.service.PartnerMediaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequiredArgsConstructor
@RequestMapping("/api/v1/partner")
public class PartnerMediaController {
    private final PartnerMediaService service;

    /** Xin uploadURL dùng một lần; trình duyệt upload file thẳng lên Cloudflare. */
    @PostMapping("/media/direct-upload")
    public DirectUploadDto directUpload(@AuthenticationPrincipal UserPrincipal p) {return service.directUpload(p);}

    @GetMapping("/homestays/{placeId}/media")
    public List<MediaDto> placeMedia(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long placeId) {return service.placeMedia(p, placeId);}

    @PostMapping("/homestays/{placeId}/media")
    public List<MediaDto> attachToPlace(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long placeId, @Valid @RequestBody AttachInput input) {return service.attachToPlace(p, placeId, input);}

    @PutMapping("/homestays/{placeId}/media/{mediaId}/cover")
    public List<MediaDto> setPlaceCover(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long placeId, @PathVariable Long mediaId) {return service.setPlaceCover(p, placeId, mediaId);}

    @DeleteMapping("/homestays/{placeId}/media/{mediaId}")
    public List<MediaDto> removeFromPlace(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long placeId, @PathVariable Long mediaId) {return service.removeFromPlace(p, placeId, mediaId);}

    @GetMapping("/homestays/{placeId}/rooms/{roomId}/media")
    public List<MediaDto> roomMedia(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long placeId, @PathVariable Long roomId) {return service.roomMedia(p, placeId, roomId);}

    @PostMapping("/homestays/{placeId}/rooms/{roomId}/media")
    public List<MediaDto> attachToRoom(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long placeId, @PathVariable Long roomId, @Valid @RequestBody AttachInput input) {return service.attachToRoom(p, placeId, roomId, input);}

    @PutMapping("/homestays/{placeId}/rooms/{roomId}/media/{mediaId}/cover")
    public List<MediaDto> setRoomCover(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long placeId, @PathVariable Long roomId, @PathVariable Long mediaId) {return service.setRoomCover(p, placeId, roomId, mediaId);}

    @DeleteMapping("/homestays/{placeId}/rooms/{roomId}/media/{mediaId}")
    public List<MediaDto> removeFromRoom(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long placeId, @PathVariable Long roomId, @PathVariable Long mediaId) {return service.removeFromRoom(p, placeId, roomId, mediaId);}
}
