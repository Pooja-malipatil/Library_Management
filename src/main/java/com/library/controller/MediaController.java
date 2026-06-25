package com.library.controller;

import com.library.model.Media;
import com.library.service.MediaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/media")
@CrossOrigin(origins = "*")
public class MediaController {

    @Autowired
    private MediaService mediaService;

    @GetMapping
    public List<Media> getAll() {
        return mediaService.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable int id) {
        try {
            return ResponseEntity.ok(mediaService.findById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/search")
    public List<Media> search(@RequestParam String keyword) {
        return mediaService.search(keyword);
    }

    @GetMapping("/type/{type}")
    public List<Media> getByType(@PathVariable String type) {
        return mediaService.getByType(type);
    }

    @PostMapping
    public ResponseEntity<?> addMedia(@RequestBody Media media) {
        try {
            return ResponseEntity.ok(mediaService.addMedia(media));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMedia(@PathVariable int id) {
        try {
            mediaService.deleteMedia(id);
            return ResponseEntity.ok("Media deleted successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @PutMapping("/{id}")
    public ResponseEntity<?> updateMedia(@PathVariable int id, @RequestBody Media media) {
        try {
            media.setId(id);
            return ResponseEntity.ok(mediaService.updateMedia(media));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}