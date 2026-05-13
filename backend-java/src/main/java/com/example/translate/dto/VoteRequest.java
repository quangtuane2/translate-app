package com.example.translate.dto;

public class VoteRequest {
    private Long historyId;
    private String voteType; // UPVOTE or DOWNVOTE

    public Long getHistoryId() { return historyId; }
    public void setHistoryId(Long historyId) { this.historyId = historyId; }
    public String getVoteType() { return voteType; }
    public void setVoteType(String voteType) { this.voteType = voteType; }
}
