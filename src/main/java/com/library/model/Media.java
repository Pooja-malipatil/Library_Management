package com.library.model;

public class Media {
    private int id;
    private String title;
    private String creator;
    private String mediaType;
    private String genre;
    private int releaseYear;
    private int totalCopies;
    private int available;

    public Media() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCreator() { return creator; }
    public void setCreator(String creator) { this.creator = creator; }
    public String getMediaType() { return mediaType; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }
    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }
    public int getReleaseYear() { return releaseYear; }
    public void setReleaseYear(int releaseYear) { this.releaseYear = releaseYear; }
    public int getTotalCopies() { return totalCopies; }
    public void setTotalCopies(int totalCopies) { this.totalCopies = totalCopies; }
    public int getAvailable() { return available; }
    public void setAvailable(int available) { this.available = available; }
}